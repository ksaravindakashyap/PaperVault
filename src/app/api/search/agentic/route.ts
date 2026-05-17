import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireActiveWorkspaceId } from "@/lib/auth";
import { decomposeQuery } from "@/lib/agentic/llm";
import { agenticPaperSearch, searchPapers } from "@/lib/agentic/semanticScholar";
import { generateEmbedding, paperTextForEmbedding } from "@/lib/embeddings";
import { findSimilarExternalPapers } from "@/lib/similarity";

// ── Query type detection ──────────────────────────────────────────────────────
// "lookup" = user is looking for a specific paper they know exists
// "explore" = user wants to discover papers on a topic
function detectQueryType(query: string): "lookup" | "explore" {
  const q = query.trim();
  const words = q.split(/\s+/);
  const isQuestion = /^(what|which|how|why|when|where|find|show|list|give|tell|are there)/i.test(q);
  const isExploration = /\b(recent|latest|new|survey|overview|state[\s-]of[\s-]the[\s-]art|sota|trend|advances|applications?|compare|versus)\b/i.test(q);
  // Short query, no question/exploration words → treat as paper title lookup
  return words.length <= 8 && !isQuestion && !isExploration ? "lookup" : "explore";
}

// ── Shared helper: cache S2 papers into ExternalPaper ────────────────────────
async function cacheS2Papers(
  papers: Awaited<ReturnType<typeof searchPapers>>
): Promise<Awaited<ReturnType<typeof db.externalPaper.upsert>>[]> {
  const cached: Awaited<ReturnType<typeof db.externalPaper.upsert>>[] = [];
  for (const paper of papers) {
    if (!paper.paperId) continue;
    try {
      const ep = await db.externalPaper.upsert({
        where: { semanticScholarId: paper.paperId },
        update: { citationCount: paper.citationCount, lastFetchedAt: new Date() },
        create: {
          semanticScholarId: paper.paperId,
          arxivId: paper.externalIds?.ArXiv ?? null,
          doi: paper.externalIds?.DOI ?? null,
          title: paper.title,
          authors: JSON.stringify(paper.authors),
          year: paper.year ?? null,
          venue: paper.venue ?? null,
          abstract: paper.abstract ?? null,
          citationCount: paper.citationCount ?? null,
          influentialCitationCount: paper.influentialCitationCount ?? null,
          publicationDate: paper.publicationDate ?? null,
          s2FieldsOfStudy: JSON.stringify(paper.s2FieldsOfStudy ?? []),
          tldr: paper.tldr?.text ?? null,
          embeddingStatus: "PENDING",
        },
      });
      cached.push(ep);
    } catch { /* skip individual failures */ }
  }
  return cached;
}

export async function POST(request: NextRequest) {
  const stepLog: string[] = [];

  try {
    stepLog.push("auth");
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const workspaceId = await requireActiveWorkspaceId();

    const { query, yearFrom, yearTo } = await request.json();
    if (!query || query.trim().length < 3) {
      return NextResponse.json({ error: "Query too short (min 3 chars)" }, { status: 400 });
    }

    const queryType = detectQueryType(query.trim());
    stepLog.push(`type:${queryType}`);

    // ── FAST PATH: paper title lookup ─────────────────────────────────────────
    // Single S2 call, no LLM, no year filter — finds the exact paper quickly
    if (queryType === "lookup") {
      stepLog.push("lookup");
      let papers: Awaited<ReturnType<typeof searchPapers>> = [];
      try {
        papers = await searchPapers([query.trim()], { limit: 15 });
      } catch (err) {
        return NextResponse.json({
          error: `Paper lookup failed: ${err instanceof Error ? err.message : String(err)}`,
          step: "lookup",
        }, { status: 502 });
      }

      const externalPapers = await cacheS2Papers(papers);

      const session = await db.searchSession.create({
        data: {
          workspaceId,
          userId: user.id,
          originalQuery: query,
          decomposedQuery: JSON.stringify({ queryType: "lookup" }),
          resultCount: externalPapers.length,
          topVenues: JSON.stringify([]),
          trendingTopics: JSON.stringify([]),
          papers: {
            create: externalPapers.map((p, idx) => ({
              externalPaperId: p.id,
              rank: idx,
              relevanceScore: 1.0 - idx * 0.05,
            })),
          },
        },
        include: { papers: { include: { paper: true }, orderBy: { rank: "asc" } } },
      });

      const sessionPapers = session.papers.map((sp) => sp.paper);

      return NextResponse.json({
        sessionId: session.id,
        query,
        decomposition: {
          intent: `Direct lookup: "${query}"`,
          keywords: query.trim().split(/\s+/).slice(0, 5),
          venues: [],
          yearRange: {},
          topics: [],
          fieldsOfStudy: [],
        },
        results: {
          total: sessionPapers.length,
          byConference: { "Direct Search": sessionPapers },
          byYear: {},
          papers: sessionPapers,
          semanticMatches: [],
        },
        metadata: {
          searchedVenues: [],
          yearRange: {},
          keywords: query.trim().split(/\s+/).slice(0, 5),
          intent: `Direct lookup: "${query}"`,
          hasSemanticReranking: false,
          queryType: "lookup",
          cacheHit: false,
          steps: stepLog,
        },
      });
    }

    // ── EXPLORE PATH ──────────────────────────────────────────────────────────

    // Run LLM decomposition and query embedding in parallel — saves ~1-2s
    stepLog.push("decompose+embed");
    const [decompositionResult, embeddingResult] = await Promise.allSettled([
      decomposeQuery(query),
      generateEmbedding(query, "query"),
    ]);

    let decomposition = decompositionResult.status === "fulfilled"
      ? decompositionResult.value
      : {
          intent: `Search for papers about: ${query}`,
          keywords: query.split(/\s+/).slice(0, 5),
          venues: [] as string[],            // no venue filter on fallback
          yearRange: { from: yearFrom ?? 2019, to: yearTo ?? new Date().getFullYear() },
          topics: [query],
          fieldsOfStudy: ["Computer Science"],
        };

    if (decompositionResult.status === "rejected") {
      console.error("Query decomposition failed:", decompositionResult.reason);
      stepLog.push("decompose:fallback");
    }

    // UI-provided year range overrides LLM — user always knows their intent better
    if (yearFrom || yearTo) {
      decomposition = {
        ...decomposition,
        yearRange: {
          from: yearFrom ?? decomposition.yearRange?.from,
          to: yearTo ?? decomposition.yearRange?.to,
        },
      };
      stepLog.push("year:ui-override");
    }

    const embeddingVec = embeddingResult.status === "fulfilled" ? embeddingResult.value : null;

    // ── Cache-first check ─────────────────────────────────────────────────────
    // If we already have ≥10 well-matched papers locally, skip S2 entirely
    if (embeddingVec) {
      stepLog.push("cache-check");
      try {
        const cacheHits = await findSimilarExternalPapers(embeddingVec, 30);
        const strongHits = cacheHits.filter((h) => h.similarity > 0.65);

        if (strongHits.length >= 10) {
          stepLog.push("cache-hit");

          const session = await db.searchSession.create({
            data: {
              workspaceId,
              userId: user.id,
              originalQuery: query,
              decomposedQuery: JSON.stringify(decomposition),
              resultCount: strongHits.length,
              topVenues: JSON.stringify([]),
              trendingTopics: JSON.stringify([]),
              papers: {
                create: strongHits.slice(0, 100).map((h, idx) => ({
                  externalPaperId: h.id,
                  rank: idx,
                  relevanceScore: h.similarity,
                })),
              },
            },
            include: { papers: { include: { paper: true }, orderBy: { rank: "asc" } } },
          });

          const sessionPapers = session.papers.map((sp) => sp.paper);
          const byConference = new Map<string, typeof sessionPapers>();
          for (const p of sessionPapers) {
            const key = p.venue || "Other";
            if (!byConference.has(key)) byConference.set(key, []);
            byConference.get(key)!.push(p);
          }

          return NextResponse.json({
            sessionId: session.id,
            query,
            decomposition,
            results: {
              total: sessionPapers.length,
              byConference: Object.fromEntries(byConference),
              byYear: {},
              papers: sessionPapers,
              semanticMatches: strongHits.slice(0, 10),
            },
            metadata: {
              searchedVenues: decomposition.venues,
              yearRange: decomposition.yearRange,
              keywords: decomposition.keywords,
              intent: decomposition.intent,
              hasSemanticReranking: true,
              queryType: "explore",
              cacheHit: true,
              steps: stepLog,
            },
          });
        }
      } catch { /* embeddings not yet populated — continue to S2 */ }
    }

    // ── S2 search ─────────────────────────────────────────────────────────────
    // Only venue-filter if LLM actually detected relevant venues
    stepLog.push("search");
    let searchOutput: Awaited<ReturnType<typeof agenticPaperSearch>>;
    try {
      searchOutput = await agenticPaperSearch(
        query,
        decomposition.keywords,
        decomposition.venues ?? [],
        decomposition.yearRange ?? {}
      );
    } catch (err) {
      return NextResponse.json({
        error: `Semantic Scholar search failed: ${err instanceof Error ? err.message : String(err)}`,
        step: "search",
      }, { status: 502 });
    }

    const { papers: allFoundPapers, byVenue } = searchOutput;

    stepLog.push("cache");
    const externalPapers = await cacheS2Papers(allFoundPapers);

    // Background-embed new papers (fire & forget — don't block response)
    void embedNewPapers(externalPapers.filter((p) => p.embeddingStatus === "PENDING"));

    stepLog.push("session");
    const session = await db.searchSession.create({
      data: {
        workspaceId,
        userId: user.id,
        originalQuery: query,
        decomposedQuery: JSON.stringify(decomposition),
        resultCount: externalPapers.length,
        topVenues: JSON.stringify(
          Array.from(byVenue.entries()).map(([v, p]) => ({ venue: v, count: p.length }))
        ),
        trendingTopics: JSON.stringify([]),
        papers: {
          create: externalPapers.slice(0, 100).map((paper, idx) => ({
            externalPaperId: paper.id,
            rank: idx,
            relevanceScore: 1.0 - idx * 0.01,
          })),
        },
      },
      include: { papers: { include: { paper: true }, orderBy: { rank: "asc" } } },
    });

    const byConference = new Map<string, typeof externalPapers>();
    const byYear = new Map<number, typeof externalPapers>();

    for (const sp of session.papers) {
      const p = sp.paper;
      if (p.year) {
        if (!byYear.has(p.year)) byYear.set(p.year, []);
        byYear.get(p.year)!.push(p);
      }
    }

    if (byVenue.size > 0) {
      for (const [venueName, venuePapers] of byVenue) {
        if (venuePapers.length === 0) continue;
        const cached = venuePapers
          .map((vp) => externalPapers.find((ep) => ep.semanticScholarId === vp.paperId))
          .filter(Boolean) as typeof externalPapers;
        if (cached.length > 0) byConference.set(venueName, cached);
      }
    }

    if (byConference.size === 0) {
      byConference.set("Relevance Search", externalPapers.slice(0, 30));
    }

    // Use any embedding results we already have for semantic matches
    const semanticResults = embeddingVec
      ? await findSimilarExternalPapers(embeddingVec, 10).catch(() => [])
      : [];

    return NextResponse.json({
      sessionId: session.id,
      query,
      decomposition,
      results: {
        total: externalPapers.length,
        byConference: Object.fromEntries(byConference),
        byYear: Object.fromEntries(byYear),
        papers: session.papers.map((sp) => sp.paper),
        semanticMatches: semanticResults,
      },
      metadata: {
        searchedVenues: decomposition.venues,
        yearRange: decomposition.yearRange,
        keywords: decomposition.keywords,
        intent: decomposition.intent,
        hasSemanticReranking: semanticResults.length > 0,
        queryType: "explore",
        cacheHit: false,
        steps: stepLog,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Agentic search failed at step [${stepLog.at(-1)}]:`, error);
    return NextResponse.json({
      error: `Search failed at step: ${stepLog.at(-1) || "unknown"}`,
      details: msg,
    }, { status: 500 });
  }
}

async function embedNewPapers(
  papers: Array<{ id: string; title: string; abstract: string | null; authors: string; venue: string | null; year: number | null }>
) {
  for (const paper of papers.slice(0, 20)) {
    try {
      const text = paperTextForEmbedding({
        title: paper.title,
        abstract: paper.abstract,
        authors: paper.authors,
        venue: paper.venue,
        year: paper.year,
      });
      const vec = await generateEmbedding(text, "passage");
      const vecLiteral = `[${vec.join(",")}]`;
      await db.$executeRaw`
        UPDATE "ExternalPaper"
        SET embedding = ${vecLiteral}::vector,
            "embeddingStatus" = 'DONE',
            "embeddedAt" = NOW()
        WHERE id = ${paper.id}
      `;
    } catch { /* best-effort */ }
  }
}

// GET — past search sessions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = await requireActiveWorkspaceId();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const sessions = await db.searchSession.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { papers: { include: { paper: true }, take: 5 } },
    });

    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
