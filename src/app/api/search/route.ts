import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess } from "@/lib/auth";

interface SearchResult {
  type: "paper" | "doc" | "todo" | "citation";
  id: string;
  title: string;
  snippet?: string;
  projectId?: string;
  paperId?: string;
  url: string;
  score: number;
  tags?: string[];
}

// Helper to generate snippet from text
function generateSnippet(text: string, query: string, maxLength: number = 120): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return text.substring(0, maxLength) + (text.length > maxLength ? "..." : "");
  }

  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + query.length + 40);
  let snippet = text.substring(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  return snippet;
}

// Helper to calculate score
function calculateScore(text: string, query: string, isTitle: boolean = false): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerText === lowerQuery) return 100;
  if (lowerText.startsWith(lowerQuery)) return isTitle ? 90 : 80;
  if (lowerText.includes(lowerQuery)) return isTitle ? 70 : 50;
  return 0;
}

// GET /api/search
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const scope = searchParams.get("scope") || "all";
    const projectId = searchParams.get("projectId") || null;
    const typesParam = searchParams.get("types") || "papers,docs,todos,citations";
    const venue = searchParams.get("venue");
    const status = searchParams.get("status");
    const yearFrom = searchParams.get("yearFrom");
    const yearTo = searchParams.get("yearTo");
    const tag = searchParams.get("tag");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const types = typesParam.split(",").map((t) => t.trim()) as Array<
      "papers" | "docs" | "todos" | "citations"
    >;

    const results: SearchResult[] = [];

    // If project scope, verify access
    if (scope === "project" && projectId) {
      const access = await requireProjectAccess(projectId, user.id);
      if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: 403 });
      }
    }

    // Get user's project memberships for filtering
    const userMemberships = await db.projectMember.findMany({
      where: { userId: user.id },
      select: { projectId: true },
    });
    const userProjectIds = userMemberships.map((m) => m.projectId);

    // Tokenize query for better matching
    const normalizedQuery = query.trim().toLowerCase();
    const tokens = normalizedQuery.split(/\s+/).filter((t) => t.length >= 2);

    // Search Papers
    if (types.includes("papers")) {
      let paperWhere: any = {};

      if (scope === "project" && projectId) {
        paperWhere = {
          projects: {
            some: {
              projectId,
            },
          },
        };
      } else if (scope === "all") {
        // Include papers in projects user is a member of OR papers not in any project
        if (userProjectIds.length > 0) {
          paperWhere = {
            OR: [
              {
                projects: {
                  some: {
                    projectId: {
                      in: userProjectIds,
                    },
                  },
                },
              },
              {
                projects: {
                  none: {},
                },
              },
            ],
          };
        } else {
          // User has no projects, show all papers not in projects
          paperWhere = {
            projects: {
              none: {},
            },
          };
        }
      }

      // Build query conditions
      if (query) {
        const queryConditions: any[] = [];
        if (tokens.length > 0) {
          // Match if ANY token matches (OR across tokens)
          queryConditions.push(
            ...tokens.flatMap((token) => [
              { title: { contains: token } },
              { authors: { contains: token } },
              { abstract: { contains: token } },
              { summary: { contains: token } },
            ])
          );
        } else {
          // Single query match
          queryConditions.push(
            { title: { contains: query } },
            { authors: { contains: query } },
            { abstract: { contains: query } },
            { summary: { contains: query } }
          );
        }

        // Combine project filter with query conditions
        if (paperWhere.OR) {
          // Already have project OR, combine with AND
          const projectFilter = { OR: paperWhere.OR };
          paperWhere.AND = [projectFilter, { OR: queryConditions }];
          delete paperWhere.OR;
        } else {
          paperWhere.OR = queryConditions;
        }
      }

      if (venue && venue !== "all") {
        paperWhere.venueType = venue;
      }

      if (status && status !== "all") {
        paperWhere.status = status;
      }

      if (yearFrom || yearTo) {
        paperWhere.year = {};
        if (yearFrom) paperWhere.year.gte = parseInt(yearFrom, 10);
        if (yearTo) paperWhere.year.lte = parseInt(yearTo, 10);
      }

      if (tag) {
        paperWhere.tags = {
          some: {
            tag: {
              name: tag,
            },
          },
        };
      }

      const papers = await db.paper.findMany({
        where: paperWhere,
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          projects: {
            take: 1,
          },
        },
        take: Math.min(limit, 50),
      });

      for (const paper of papers) {
        if (!paper.title) continue;

        const score = calculateScore(paper.title, query, true);
        const snippet = paper.abstract
          ? generateSnippet(paper.abstract, query)
          : undefined;

        results.push({
          type: "paper",
          id: paper.id,
          title: paper.title,
          snippet,
          projectId: paper.projects[0]?.projectId,
          url: `/papers/${paper.id}`,
          score,
          tags: paper.tags.map((pt) => pt.tag.name),
        });
      }
    }

    // Search Docs
    if (types.includes("docs")) {
      let docWhere: any = {};

      if (scope === "project" && projectId) {
        docWhere.projectId = projectId;
      } else if (scope === "all") {
        docWhere.projectId = {
          in: userProjectIds,
        };
      }

      if (query) {
        docWhere.OR = [
          { title: { contains: query } },
          { content: { contains: query } },
        ];
      }

      if (tag) {
        docWhere.tags = {
          some: {
            tag: {
              name: tag,
            },
          },
        };
      }

      const docs = await db.doc.findMany({
        where: docWhere,
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
        take: limit,
      });

      for (const doc of docs) {
        const titleScore = calculateScore(doc.title, query, true);
        const contentScore = doc.content
          ? calculateScore(doc.content, query, false)
          : 0;
        const score = Math.max(titleScore, contentScore);
        const snippet = doc.content
          ? generateSnippet(doc.content, query)
          : undefined;

        results.push({
          type: "doc",
          id: doc.id,
          title: doc.title,
          snippet,
          projectId: doc.projectId,
          url: `/docs/${doc.id}`,
          score,
          tags: doc.tags.map((dt) => dt.tag.name),
        });
      }
    }

    // Search Todos
    if (types.includes("todos")) {
      let todoWhere: any = {};

      if (scope === "project" && projectId) {
        todoWhere.projectId = projectId;
      } else if (scope === "all") {
        todoWhere.projectId = {
          in: userProjectIds,
        };
      }

      if (query) {
        todoWhere.OR = [
          { title: { contains: query } },
          { notes: { contains: query } },
        ];
      }

      if (status) {
        todoWhere.status = status;
      }

      const todos = await db.todo.findMany({
        where: todoWhere,
        take: limit,
      });

      for (const todo of todos) {
        const titleScore = calculateScore(todo.title, query, true);
        const notesScore = todo.notes
          ? calculateScore(todo.notes, query, false)
          : 0;
        const score = Math.max(titleScore, notesScore);
        const snippet = todo.notes
          ? generateSnippet(todo.notes, query)
          : undefined;

        results.push({
          type: "todo",
          id: todo.id,
          title: todo.title,
          snippet,
          projectId: todo.projectId,
          url: `/projects/${todo.projectId}?tab=todos`,
          score,
        });
      }
    }

    // Search Citations
    if (types.includes("citations")) {
      let citationWhere: any = {};

      if (scope === "project" && projectId) {
        citationWhere.sourcePaper = {
          projects: {
            some: {
              projectId,
            },
          },
        };
      } else if (scope === "all") {
        citationWhere.sourcePaper = {
          projects: {
            some: {
              projectId: {
                in: userProjectIds,
              },
            },
          },
        };
      }

      if (query) {
        citationWhere.OR = [
          { title: { contains: query } },
          { authors: { contains: query } },
          { raw: { contains: query } },
        ];
      }

      const citations = await db.citation.findMany({
        where: citationWhere,
        include: {
          sourcePaper: {
            include: {
              projects: {
                take: 1,
              },
            },
          },
        },
        take: limit,
      });

      for (const citation of citations) {
        const title = citation.title || citation.raw.substring(0, 100);
        const score = citation.title
          ? calculateScore(citation.title, query, true)
          : calculateScore(citation.raw, query, false);
        const snippet = generateSnippet(citation.raw, query);

        results.push({
          type: "citation",
          id: citation.id,
          title,
          snippet,
          projectId: citation.sourcePaper.projects[0]?.projectId,
          paperId: citation.sourcePaperId,
          url: `/papers/${citation.sourcePaperId}#citations`,
          score,
        });
      }
    }

    // Sort by score (descending) and limit
    results.sort((a, b) => b.score - a.score);
    const limitedResults = results.slice(0, Math.min(limit, 50));

    // Count by type for debug
    const countsByType = {
      papers: results.filter((r) => r.type === "paper").length,
      docs: results.filter((r) => r.type === "doc").length,
      todos: results.filter((r) => r.type === "todo").length,
      citations: results.filter((r) => r.type === "citation").length,
    };

    return NextResponse.json({
      query,
      results: limitedResults,
      debug: {
        q: query,
        tokens,
        scope,
        types: Array.from(types),
        appliedFilters: {
          venue: venue && venue !== "all" ? venue : null,
          status: status && status !== "all" ? status : null,
          tag: tag || null,
        },
        countsByType,
      },
    });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
