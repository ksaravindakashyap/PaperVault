import { cookies } from "next/headers";
import { db } from "@/lib/db";

const USER_ID_COOKIE = "papervault_user_id";

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
