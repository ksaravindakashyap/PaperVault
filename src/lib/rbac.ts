import { db } from "./db";
import { WorkspaceRole, ProjectRole } from "@prisma/client";

// Permission actions for workspaces
export enum WorkspacePermission {
  // Paper management
  UPLOAD_PAPER = "workspace:upload_paper",
  DELETE_PAPER = "workspace:delete_paper",
  EDIT_PAPER_METADATA = "workspace:edit_paper_metadata",
  VIEW_PAPERS = "workspace:view_papers",
  TRIGGER_CRAWL = "workspace:trigger_crawl",
  
  // Workspace management
  MANAGE_MEMBERS = "workspace:manage_members",
  CREATE_INVITES = "workspace:create_invites",
  DELETE_WORKSPACE = "workspace:delete_workspace",
  EDIT_WORKSPACE = "workspace:edit_workspace",
  
  // Project management
  CREATE_PROJECT = "workspace:create_project",
  DELETE_PROJECT = "workspace:delete_project",
  
  // Advanced features
  VIEW_AUDIT_LOG = "workspace:view_audit_log",
  MANAGE_TAGS = "workspace:manage_tags",
}

// Permission actions for projects
export enum ProjectPermission {
  // Content management
  CREATE_DOC = "project:create_doc",
  EDIT_DOC = "project:edit_doc",
  DELETE_DOC = "project:delete_doc",
  VIEW_DOCS = "project:view_docs",
  
  // Paper association
  ADD_PAPER = "project:add_paper",
  REMOVE_PAPER = "project:remove_paper",
  
  // Collaboration
  CREATE_COMMENT = "project:create_comment",
  DELETE_COMMENT = "project:delete_comment",
  
  // Project management
  EDIT_PROJECT = "project:edit_project",
  DELETE_PROJECT = "project:delete_project",
  MANAGE_MEMBERS = "project:manage_members",
  CREATE_INVITES = "project:create_invites",
  
  // Task management
  CREATE_TODO = "project:create_todo",
  EDIT_TODO = "project:edit_todo",
  DELETE_TODO = "project:delete_todo",
  VIEW_TODOS = "project:view_todos",
}

// Define role permissions
const WORKSPACE_ROLE_PERMISSIONS: Record<WorkspaceRole, WorkspacePermission[]> = {
  [WorkspaceRole.OWNER]: [
    // Owners can do everything
    WorkspacePermission.UPLOAD_PAPER,
    WorkspacePermission.DELETE_PAPER,
    WorkspacePermission.EDIT_PAPER_METADATA,
    WorkspacePermission.VIEW_PAPERS,
    WorkspacePermission.TRIGGER_CRAWL,
    WorkspacePermission.MANAGE_MEMBERS,
    WorkspacePermission.CREATE_INVITES,
    WorkspacePermission.DELETE_WORKSPACE,
    WorkspacePermission.EDIT_WORKSPACE,
    WorkspacePermission.CREATE_PROJECT,
    WorkspacePermission.DELETE_PROJECT,
    WorkspacePermission.VIEW_AUDIT_LOG,
    WorkspacePermission.MANAGE_TAGS,
  ],
  [WorkspaceRole.ADMIN]: [
    // Admins can manage most things except deleting workspace
    WorkspacePermission.UPLOAD_PAPER,
    WorkspacePermission.DELETE_PAPER,
    WorkspacePermission.EDIT_PAPER_METADATA,
    WorkspacePermission.VIEW_PAPERS,
    WorkspacePermission.TRIGGER_CRAWL,
    WorkspacePermission.MANAGE_MEMBERS,
    WorkspacePermission.CREATE_INVITES,
    WorkspacePermission.EDIT_WORKSPACE,
    WorkspacePermission.CREATE_PROJECT,
    WorkspacePermission.DELETE_PROJECT,
    WorkspacePermission.VIEW_AUDIT_LOG,
    WorkspacePermission.MANAGE_TAGS,
  ],
  [WorkspaceRole.MEMBER]: [
    // Members can contribute but not manage
    WorkspacePermission.UPLOAD_PAPER,
    WorkspacePermission.EDIT_PAPER_METADATA,
    WorkspacePermission.VIEW_PAPERS,
    WorkspacePermission.CREATE_PROJECT,
    WorkspacePermission.MANAGE_TAGS,
  ],
};

const PROJECT_ROLE_PERMISSIONS: Record<ProjectRole, ProjectPermission[]> = {
  [ProjectRole.OWNER]: [
    // Project owners can do everything
    ProjectPermission.CREATE_DOC,
    ProjectPermission.EDIT_DOC,
    ProjectPermission.DELETE_DOC,
    ProjectPermission.VIEW_DOCS,
    ProjectPermission.ADD_PAPER,
    ProjectPermission.REMOVE_PAPER,
    ProjectPermission.CREATE_COMMENT,
    ProjectPermission.DELETE_COMMENT,
    ProjectPermission.EDIT_PROJECT,
    ProjectPermission.DELETE_PROJECT,
    ProjectPermission.MANAGE_MEMBERS,
    ProjectPermission.CREATE_INVITES,
    ProjectPermission.CREATE_TODO,
    ProjectPermission.EDIT_TODO,
    ProjectPermission.DELETE_TODO,
    ProjectPermission.VIEW_TODOS,
  ],
  [ProjectRole.EDITOR]: [
    // Editors can modify content but not manage project
    ProjectPermission.CREATE_DOC,
    ProjectPermission.EDIT_DOC,
    ProjectPermission.VIEW_DOCS,
    ProjectPermission.ADD_PAPER,
    ProjectPermission.REMOVE_PAPER,
    ProjectPermission.CREATE_COMMENT,
    ProjectPermission.CREATE_TODO,
    ProjectPermission.EDIT_TODO,
    ProjectPermission.VIEW_TODOS,
  ],
  [ProjectRole.COMMENTER]: [
    // Commenters can only view and comment
    ProjectPermission.VIEW_DOCS,
    ProjectPermission.CREATE_COMMENT,
    ProjectPermission.VIEW_TODOS,
  ],
};

/**
 * Check if a user has a specific workspace permission
 */
export async function hasWorkspacePermission(
  userId: string,
  workspaceId: string,
  permission: WorkspacePermission
): Promise<boolean> {
  const membership = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });
  
  if (!membership) return false;
  
  const allowedPermissions = WORKSPACE_ROLE_PERMISSIONS[membership.role];
  return allowedPermissions.includes(permission);
}

/**
 * Check if a user has a specific project permission
 */
export async function hasProjectPermission(
  userId: string,
  projectId: string,
  permission: ProjectPermission
): Promise<boolean> {
  const membership = await db.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
  
  if (!membership) return false;
  
  const allowedPermissions = PROJECT_ROLE_PERMISSIONS[membership.role];
  return allowedPermissions.includes(permission);
}

/**
 * Require workspace permission or throw error
 */
export async function requireWorkspacePermission(
  userId: string,
  workspaceId: string,
  permission: WorkspacePermission
): Promise<void> {
  const allowed = await hasWorkspacePermission(userId, workspaceId, permission);
  
  if (!allowed) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

/**
 * Require project permission or throw error
 */
export async function requireProjectPermission(
  userId: string,
  projectId: string,
  permission: ProjectPermission
): Promise<void> {
  const allowed = await hasProjectPermission(userId, projectId, permission);
  
  if (!allowed) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

/**
 * Get all permissions for a user in a workspace
 */
export async function getUserWorkspacePermissions(
  userId: string,
  workspaceId: string
): Promise<WorkspacePermission[]> {
  const membership = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });
  
  if (!membership) return [];
  
  return WORKSPACE_ROLE_PERMISSIONS[membership.role];
}

/**
 * Get all permissions for a user in a project
 */
export async function getUserProjectPermissions(
  userId: string,
  projectId: string
): Promise<ProjectPermission[]> {
  const membership = await db.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
  
  if (!membership) return [];
  
  return PROJECT_ROLE_PERMISSIONS[membership.role];
}

/**
 * Get user's role in a workspace
 */
export async function getUserWorkspaceRole(
  userId: string,
  workspaceId: string
): Promise<WorkspaceRole | null> {
  const membership = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });
  
  return membership?.role || null;
}

/**
 * Get user's role in a project
 */
export async function getUserProjectRole(
  userId: string,
  projectId: string
): Promise<ProjectRole | null> {
  const membership = await db.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
  
  return membership?.role || null;
}

/**
 * Check if user is workspace owner
 */
export async function isWorkspaceOwner(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const role = await getUserWorkspaceRole(userId, workspaceId);
  return role === WorkspaceRole.OWNER;
}

/**
 * Check if user is project owner
 */
export async function isProjectOwner(
  userId: string,
  projectId: string
): Promise<boolean> {
  const role = await getUserProjectRole(userId, projectId);
  return role === ProjectRole.OWNER;
}

/**
 * Promote/demote a workspace member
 */
export async function updateWorkspaceMemberRole(
  actorId: string,
  workspaceId: string,
  targetUserId: string,
  newRole: WorkspaceRole
): Promise<void> {
  // Check if actor has permission
  await requireWorkspacePermission(
    actorId,
    workspaceId,
    WorkspacePermission.MANAGE_MEMBERS
  );
  
  // Prevent demoting the last owner
  if (newRole !== WorkspaceRole.OWNER) {
    const ownerCount = await db.workspaceMember.count({
      where: {
        workspaceId,
        role: WorkspaceRole.OWNER,
      },
    });
    
    const targetRole = await getUserWorkspaceRole(targetUserId, workspaceId);
    
    if (targetRole === WorkspaceRole.OWNER && ownerCount === 1) {
      throw new Error("Cannot demote the last workspace owner");
    }
  }
  
  await db.workspaceMember.update({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: targetUserId,
      },
    },
    data: {
      role: newRole,
    },
  });
}

/**
 * Promote/demote a project member
 */
export async function updateProjectMemberRole(
  actorId: string,
  projectId: string,
  targetUserId: string,
  newRole: ProjectRole
): Promise<void> {
  // Check if actor has permission
  await requireProjectPermission(
    actorId,
    projectId,
    ProjectPermission.MANAGE_MEMBERS
  );
  
  // Prevent demoting the last owner
  if (newRole !== ProjectRole.OWNER) {
    const ownerCount = await db.projectMember.count({
      where: {
        projectId,
        role: ProjectRole.OWNER,
      },
    });
    
    const targetRole = await getUserProjectRole(targetUserId, projectId);
    
    if (targetRole === ProjectRole.OWNER && ownerCount === 1) {
      throw new Error("Cannot demote the last project owner");
    }
  }
  
  await db.projectMember.update({
    where: {
      projectId_userId: {
        projectId,
        userId: targetUserId,
      },
    },
    data: {
      role: newRole,
    },
  });
}
