import { db } from "./db";

/**
 * Enhanced audit logging system
 */

export enum AuditAction {
  // Workspace actions
  WORKSPACE_CREATED = "WORKSPACE_CREATED",
  WORKSPACE_UPDATED = "WORKSPACE_UPDATED",
  WORKSPACE_DELETED = "WORKSPACE_DELETED",
  MEMBER_ADDED = "MEMBER_ADDED",
  MEMBER_REMOVED = "MEMBER_REMOVED",
  MEMBER_ROLE_CHANGED = "MEMBER_ROLE_CHANGED",
  INVITE_CREATED = "INVITE_CREATED",
  
  // Paper actions
  PAPER_UPLOADED = "PAPER_UPLOADED",
  PAPER_DELETED = "PAPER_DELETED",
  PAPER_UPDATED = "PAPER_UPDATED",
  PAPER_PROCESSED = "PAPER_PROCESSED",
  CRAWLER_TRIGGERED = "CRAWLER_TRIGGERED",
  
  // Project actions
  PROJECT_CREATED = "PROJECT_CREATED",
  PROJECT_UPDATED = "PROJECT_UPDATED",
  PROJECT_DELETED = "PROJECT_DELETED",
  PAPER_ADDED_TO_PROJECT = "PAPER_ADDED_TO_PROJECT",
  PAPER_REMOVED_FROM_PROJECT = "PAPER_REMOVED_FROM_PROJECT",
  
  // Doc actions
  DOC_CREATED = "DOC_CREATED",
  DOC_UPDATED = "DOC_UPDATED",
  DOC_DELETED = "DOC_DELETED",
  COMMENT_ADDED = "COMMENT_ADDED",
  COMMENT_DELETED = "COMMENT_DELETED",
  
  // Todo actions
  TODO_CREATED = "TODO_CREATED",
  TODO_UPDATED = "TODO_UPDATED",
  TODO_DELETED = "TODO_DELETED",
  
  // Permission actions
  PERMISSION_DENIED = "PERMISSION_DENIED",
}

interface AuditMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Log an audit event for a project
 */
export async function logAuditEvent(
  projectId: string,
  actorId: string,
  action: AuditAction | string,
  metadata?: AuditMetadata,
  docId?: string
): Promise<void> {
  try {
    await db.auditEvent.create({
      data: {
        projectId,
        actorId,
        action,
        metadata: metadata ? JSON.stringify(metadata) : null,
        docId,
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
    // Don't throw - audit logging failures shouldn't break the main action
  }
}

/**
 * Log a workspace-level event (using a default "workspace" project)
 * For tracking workspace-level actions like crawls, member management, etc.
 */
export async function logWorkspaceAuditEvent(
  workspaceId: string,
  actorId: string,
  action: AuditAction | string,
  metadata?: AuditMetadata
): Promise<void> {
  try {
    // Find or create a system project for workspace-level audit logs
    const systemProject = await db.project.findFirst({
      where: {
        workspaceId,
        name: "__workspace_audit__",
      },
    });
    
    let projectId: string;
    
    if (systemProject) {
      projectId = systemProject.id;
    } else {
      // Create system project for audit logging
      const newProject = await db.project.create({
        data: {
          workspaceId,
          name: "__workspace_audit__",
          description: "System project for workspace-level audit logs",
          createdByUserId: actorId,
        },
      });
      projectId = newProject.id;
    }
    
    await logAuditEvent(projectId, actorId, action, metadata);
  } catch (error) {
    console.error("Failed to log workspace audit event:", error);
  }
}

/**
 * Get audit events for a project
 */
export async function getProjectAuditEvents(
  projectId: string,
  limit: number = 100,
  offset: number = 0
) {
  return db.auditEvent.findMany({
    where: { projectId },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
        },
      },
      doc: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip: offset,
  });
}

/**
 * Get audit events for a workspace (from the system project)
 */
export async function getWorkspaceAuditEvents(
  workspaceId: string,
  limit: number = 100,
  offset: number = 0
) {
  const systemProject = await db.project.findFirst({
    where: {
      workspaceId,
      name: "__workspace_audit__",
    },
  });
  
  if (!systemProject) {
    return [];
  }
  
  return getProjectAuditEvents(systemProject.id, limit, offset);
}

/**
 * Get audit events for a specific user
 */
export async function getUserAuditEvents(
  userId: string,
  workspaceId: string,
  limit: number = 100,
  offset: number = 0
) {
  return db.auditEvent.findMany({
    where: {
      actorId: userId,
      project: {
        workspaceId,
      },
    },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      doc: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip: offset,
  });
}

/**
 * Search audit events
 */
export async function searchAuditEvents(
  workspaceId: string,
  filters: {
    projectId?: string;
    actorId?: string;
    action?: string;
    fromDate?: Date;
    toDate?: Date;
  },
  limit: number = 100,
  offset: number = 0
) {
  return db.auditEvent.findMany({
    where: {
      project: {
        workspaceId,
      },
      ...(filters.projectId && { projectId: filters.projectId }),
      ...(filters.actorId && { actorId: filters.actorId }),
      ...(filters.action && { action: filters.action }),
      ...(filters.fromDate || filters.toDate
        ? {
            createdAt: {
              ...(filters.fromDate && { gte: filters.fromDate }),
              ...(filters.toDate && { lte: filters.toDate }),
            },
          }
        : {}),
    },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      doc: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip: offset,
  });
}
