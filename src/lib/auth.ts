import { cookies } from "next/headers";
import { db } from "@/lib/db";

const USER_ID_COOKIE = "papervault_user_id";
const ACTIVE_WORKSPACE_COOKIE = "papervault_active_workspace";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(USER_ID_COOKIE)?.value;

  if (!userId) {
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });
    return user;
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}

export async function setUserIdCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(USER_ID_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
}

export async function getProjectMember(
  projectId: string,
  userId: string | null
) {
  if (!userId) {
    return null;
  }

  try {
    const member = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      include: {
        user: true,
      },
    });
    return member;
  } catch (error) {
    console.error("Failed to get project member:", error);
    return null;
  }
}

export async function requireProjectAccess(
  projectId: string,
  userId: string | null,
  requiredRole?: "OWNER" | "EDITOR" | "COMMENTER"
) {
  const user = userId ? await getCurrentUser() : null;
  if (!user) {
    return { allowed: false, member: null, error: "Not authenticated" };
  }

  const member = await getProjectMember(projectId, user.id);
  if (!member) {
    return { allowed: false, member: null, error: "Not a project member" };
  }

  if (requiredRole) {
    const roleHierarchy = { OWNER: 3, EDITOR: 2, COMMENTER: 1 };
    const userRoleLevel = roleHierarchy[member.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return {
        allowed: false,
        member,
        error: `Requires ${requiredRole} role`,
      };
    }
  }

  return { allowed: true, member, error: null };
}

export async function getActiveWorkspaceId(): Promise<string | null> {
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  return workspaceId || null;
}

export async function setActiveWorkspaceCookie(workspaceId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
}

export async function getWorkspaceMember(
  workspaceId: string,
  userId: string | null
) {
  if (!userId) {
    return null;
  }

  try {
    const member = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      include: {
        user: true,
      },
    });
    return member;
  } catch (error) {
    console.error("Failed to get workspace member:", error);
    return null;
  }
}

export async function requireWorkspaceAccess(
  workspaceId: string,
  userId: string | null,
  requiredRole?: "OWNER" | "ADMIN" | "MEMBER"
) {
  const user = userId ? await getCurrentUser() : null;
  if (!user) {
    return { allowed: false, member: null, error: "Not authenticated" };
  }

  const member = await getWorkspaceMember(workspaceId, user.id);
  if (!member) {
    return { allowed: false, member: null, error: "Not a workspace member" };
  }

  if (requiredRole) {
    const roleHierarchy = { OWNER: 3, ADMIN: 2, MEMBER: 1 };
    const userRoleLevel = roleHierarchy[member.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return {
        allowed: false,
        member,
        error: `Requires ${requiredRole} role`,
      };
    }
  }

  return { allowed: true, member, error: null };
}

export async function requireActiveWorkspace() {
  // Get or create local user
  let user = await getCurrentUser();
  if (!user) {
    user = await db.user.create({
      data: {
        name: "Local User",
      },
    });
    await setUserIdCookie(user.id);
  }

  // Get user's workspace memberships
  let memberships = await db.workspaceMember.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // If no workspaces, create a default one
  if (memberships.length === 0) {
    const defaultWorkspace = await db.workspace.create({
      data: {
        name: "Default Workspace",
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });
    await setActiveWorkspaceCookie(defaultWorkspace.id);
    return { hasWorkspace: true, workspaceId: defaultWorkspace.id, redirect: null };
  }

  // Check active workspace cookie
  let activeWorkspaceId = await getActiveWorkspaceId();

  // If no active workspace or invalid, set to newest membership
  if (!activeWorkspaceId) {
    activeWorkspaceId = memberships[0].workspaceId;
    await setActiveWorkspaceCookie(activeWorkspaceId);
  } else {
    // Verify the active workspace is still valid
    const isValid = memberships.some(
      (m) => m.workspaceId === activeWorkspaceId
    );
    if (!isValid) {
      activeWorkspaceId = memberships[0].workspaceId;
      await setActiveWorkspaceCookie(activeWorkspaceId);
    }
  }

  return { hasWorkspace: true, workspaceId: activeWorkspaceId, redirect: null };
}

// Helper to get active workspace ID for API routes (throws if not available)
export async function requireActiveWorkspaceId(): Promise<string> {
  const result = await requireActiveWorkspace();
  if (!result.hasWorkspace || !result.workspaceId) {
    throw new Error("No active workspace");
  }
  return result.workspaceId;
}
