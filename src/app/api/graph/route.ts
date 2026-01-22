import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess } from "@/lib/auth";

// GET /api/graph?scope=project&projectId=...
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const projectId = searchParams.get("projectId");

    if (scope !== "project" || !projectId) {
      return NextResponse.json(
        { error: "scope=project and projectId are required" },
        { status: 400 }
      );
    }

    // Verify access
    const access = await requireProjectAccess(projectId, user.id);
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 });
    }

    // Get project
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get papers in project
    const projectPapers = await db.projectPaper.findMany({
      where: { projectId },
      include: {
        paper: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
            citations: {
              where: {
                targetPaperId: {
                  not: null,
                },
              },
              include: {
                targetPaper: {
                  include: {
                    projects: {
                      where: {
                        projectId,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const nodes: Array<{
      id: string;
      kind: "project" | "paper" | "tag";
      label: string;
      meta?: any;
    }> = [];

    const edges: Array<{
      id: string;
      source: string;
      target: string;
      kind: "contains" | "tagged" | "cites";
    }> = [];

    // Add project node
    nodes.push({
      id: projectId,
      kind: "project",
      label: project.name,
      meta: {
        description: project.description,
        paperCount: projectPapers.length,
      },
    });

    // Add paper nodes and edges
    const tagIds = new Set<string>();
    const paperIds = new Set<string>();

    for (const pp of projectPapers) {
      const paper = pp.paper;
      if (!paper.title) continue;

      paperIds.add(paper.id);

      // Add paper node
      nodes.push({
        id: paper.id,
        kind: "paper",
        label: paper.title,
        meta: {
          venueType: paper.venueType,
          year: paper.year,
          status: paper.status,
        },
      });

      // Add project -> paper edge
      edges.push({
        id: `project-${paper.id}`,
        source: projectId,
        target: paper.id,
        kind: "contains",
      });

      // Add paper -> tag edges
      for (const paperTag of paper.tags) {
        tagIds.add(paperTag.tag.id);
        edges.push({
          id: `paper-${paper.id}-tag-${paperTag.tag.id}`,
          source: paper.id,
          target: paperTag.tag.id,
          kind: "tagged",
        });
      }

      // Add paper -> paper citation edges (if target is also in project)
      for (const citation of paper.citations) {
        if (
          citation.targetPaper &&
          citation.targetPaper.projects.length > 0
        ) {
          const targetPaperId = citation.targetPaper.id;
          if (paperIds.has(targetPaperId)) {
            edges.push({
              id: `cite-${paper.id}-${targetPaperId}`,
              source: paper.id,
              target: targetPaperId,
              kind: "cites",
            });
          }
        }
      }
    }

    // Add tag nodes
    const tags = await db.tag.findMany({
      where: {
        id: {
          in: Array.from(tagIds),
        },
      },
    });

    for (const tag of tags) {
      nodes.push({
        id: tag.id,
        kind: "tag",
        label: tag.name,
      });
    }

    // Also get tags from docs in project
    const docs = await db.doc.findMany({
      where: { projectId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    for (const doc of docs) {
      for (const docTag of doc.tags) {
        if (!tagIds.has(docTag.tag.id)) {
          tagIds.add(docTag.tag.id);
          nodes.push({
            id: docTag.tag.id,
            kind: "tag",
            label: docTag.tag.name,
          });
        }
      }
    }

    return NextResponse.json({
      nodes,
      edges,
    });
  } catch (error) {
    console.error("Failed to generate graph:", error);
    return NextResponse.json(
      { error: "Failed to generate graph" },
      { status: 500 }
    );
  }
}
