import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess, requireActiveWorkspaceId, setUserIdCookie } from "@/lib/auth";
import { findSimilarPapers } from "@/lib/similarity";

// GET /api/graph?scope=project&projectId=...
export async function GET(request: NextRequest) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      user = await db.user.create({ data: { name: "Local User" } });
      await setUserIdCookie(user.id);
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const projectId = searchParams.get("projectId");

    if (scope !== "project" || !projectId) {
      return NextResponse.json(
        { error: "scope=project and projectId are required" },
        { status: 400 }
      );
    }

    const access = await requireProjectAccess(projectId, user.id);
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 });
    }

    const workspaceId = await requireActiveWorkspaceId();

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Project not in active workspace" }, { status: 403 });
    }

    // Get all papers in this project
    const allProjectPapers = await db.projectPaper.findMany({
      where: { projectId },
      include: {
        paper: {
          include: {
            tags: { include: { tag: true } },
            citations: {
              where: { targetPaperId: { not: null } },
              include: {
                targetPaper: {
                  include: { projects: { where: { projectId } } },
                },
              },
            },
          },
        },
      },
    });

    const projectPapers = allProjectPapers.filter(
      (pp) => pp.paper && pp.paper.workspaceId === workspaceId
    );

    const nodes: Array<{
      id: string;
      kind: "project" | "paper" | "tag";
      label: string;
      meta?: Record<string, unknown>;
    }> = [];

    const edges: Array<{
      id: string;
      source: string;
      target: string;
      kind: "contains" | "tagged" | "cites" | "similar";
      weight?: number;
    }> = [];

    // Project node
    nodes.push({
      id: projectId,
      kind: "project",
      label: project.name,
      meta: { description: project.description, paperCount: projectPapers.length },
    });

    const tagIds = new Set<string>();
    const paperIds = new Set<string>();
    const edgeSet = new Set<string>();

    const addEdge = (edge: typeof edges[0]) => {
      if (!edgeSet.has(edge.id)) {
        edgeSet.add(edge.id);
        edges.push(edge);
      }
    };

    // Paper nodes + citation edges
    for (const pp of projectPapers) {
      const paper = pp.paper;
      if (!paper.title) continue;

      paperIds.add(paper.id);

      nodes.push({
        id: paper.id,
        kind: "paper",
        label: paper.title,
        meta: {
          venueType: paper.venueType,
          year: paper.year,
          status: paper.status,
          authors: paper.authors,
          hasEmbedding: paper.embeddingStatus === "DONE",
        },
      });

      addEdge({
        id: `project-${paper.id}`,
        source: projectId,
        target: paper.id,
        kind: "contains",
      });

      // Tag edges (workspace-scoped)
      for (const pt of paper.tags) {
        if (pt.tag.workspaceId === workspaceId) {
          tagIds.add(pt.tag.id);
          addEdge({
            id: `paper-${paper.id}-tag-${pt.tag.id}`,
            source: paper.id,
            target: pt.tag.id,
            kind: "tagged",
          });
        }
      }

      // Citation edges (only within project)
      for (const citation of paper.citations) {
        if (citation.targetPaper && citation.targetPaper.projects.length > 0) {
          const targetId = citation.targetPaper.id;
          if (paperIds.has(targetId)) {
            addEdge({
              id: `cite-${paper.id}-${targetId}`,
              source: paper.id,
              target: targetId,
              kind: "cites",
            });
          }
        }
      }
    }

    // Semantic similarity edges (pgvector)
    const SIMILARITY_THRESHOLD = 0.75;
    for (const id of paperIds) {
      try {
        const similar = await findSimilarPapers(id, workspaceId, 5);
        for (const sim of similar) {
          if (paperIds.has(sim.id) && sim.similarity >= SIMILARITY_THRESHOLD) {
            // Use canonical ordering so we don't add A→B and B→A separately
            const [a, b] = [id, sim.id].sort();
            addEdge({
              id: `similar-${a}-${b}`,
              source: a,
              target: b,
              kind: "similar",
              weight: Math.round(sim.similarity * 100) / 100,
            });
          }
        }
      } catch {
        // Embedding not ready yet — skip
      }
    }

    // Tag nodes
    const tags = await db.tag.findMany({
      where: { id: { in: Array.from(tagIds) }, workspaceId },
    });
    for (const tag of tags) {
      nodes.push({ id: tag.id, kind: "tag", label: tag.name });
    }

    // Doc tags
    const docs = await db.doc.findMany({
      where: { projectId },
      include: { tags: { include: { tag: true } } },
    });
    for (const doc of docs) {
      for (const dt of doc.tags) {
        if (!tagIds.has(dt.tag.id)) {
          tagIds.add(dt.tag.id);
          nodes.push({ id: dt.tag.id, kind: "tag", label: dt.tag.name });
        }
      }
    }

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    console.error("Failed to generate graph:", error);
    return NextResponse.json({ error: "Failed to generate graph" }, { status: 500 });
  }
}
