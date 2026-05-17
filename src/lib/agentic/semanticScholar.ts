const BASE_URL = "https://api.semanticscholar.org/graph/v1";
const API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY;

const FIELDS =
  "paperId,externalIds,title,authors,year,venue,abstract,citationCount,influentialCitationCount,publicationDate,s2FieldsOfStudy,tldr";

export interface SemanticScholarPaper {
  paperId: string;
  externalIds?: { ArXiv?: string; DOI?: string };
  title: string;
  authors: Array<{ name: string }>;
  year: number;
  venue: string;
  abstract?: string;
  citationCount: number;
  influentialCitationCount: number;
  publicationDate?: string;
  s2FieldsOfStudy?: Array<{ category: string }>;
  tldr?: { text: string };
}

function headers(): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (API_KEY) h["x-api-key"] = API_KEY;
  return h;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url: string, opts: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, opts);
    if (res.status === 429) {
      if (i < retries) {
        await sleep(1500 * (i + 1)); // 1.5s, then 3s
        continue;
      }
    }
    return res;
  }
  throw new Error("Max retries exceeded");
}

/**
 * Direct relevance search — uses S2's own ranking, no venue/year filter.
 * Best for specific paper queries or when you want the most relevant results first.
 */
export async function searchPapers(
  keywords: string[],
  options: {
    year?: string;
    fieldsOfStudy?: string[];
    venue?: string;
    limit?: number;
  } = {}
): Promise<SemanticScholarPaper[]> {
  const query = keywords.join(" ");
  const params = new URLSearchParams({
    query,
    limit: String(Math.min(options.limit || 20, 100)),
    fields: FIELDS,
  });

  if (options.year) params.append("year", options.year);
  if (options.fieldsOfStudy?.length) {
    params.append("fieldsOfStudy", options.fieldsOfStudy.join(","));
  }
  if (options.venue) params.append("venue", options.venue);

  const res = await fetchWithRetry(
    `${BASE_URL}/paper/search?${params}`,
    { headers: headers(), next: { revalidate: 3600 } } as RequestInit
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Semantic Scholar API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.data || []).filter((p: SemanticScholarPaper) => p.title);
}

/**
 * Two-phase search strategy:
 * 1. Broad relevance search with the full original query (no year/venue filter) — finds the
 *    most semantically relevant papers regardless of when they were published.
 * 2. Venue-filtered recency search — surfaces recent work at top conferences.
 * Results are merged and de-duplicated; broad results come first.
 */
export async function agenticPaperSearch(
  originalQuery: string,
  keywords: string[],
  venues: string[],
  yearRange: { from?: number; to?: number }
): Promise<{ papers: SemanticScholarPaper[]; byVenue: Map<string, SemanticScholarPaper[]> }> {
  const byVenue = new Map<string, SemanticScholarPaper[]>();
  const seen = new Set<string>();
  const allPapers: SemanticScholarPaper[] = [];

  // Phase 1: broad relevance search with the original query string
  try {
    const broad = await searchPapers([originalQuery], { limit: 30 });
    for (const p of broad) {
      if (p.paperId && !seen.has(p.paperId)) {
        seen.add(p.paperId);
        allPapers.push(p);
      }
    }
  } catch (err) {
    console.error("Broad relevance search failed:", err);
  }

  // Phase 1b: keyword-based search without year filter (catches synonyms & paraphrases)
  try {
    const kwSearch = await searchPapers(keywords.slice(0, 5), { limit: 20 });
    for (const p of kwSearch) {
      if (p.paperId && !seen.has(p.paperId)) {
        seen.add(p.paperId);
        allPapers.push(p);
      }
    }
  } catch (err) {
    console.error("Keyword search failed:", err);
  }

  // Phase 2: venue-filtered recency search
  const yearFilter =
    yearRange.from && yearRange.to
      ? `${yearRange.from}-${yearRange.to}`
      : `${new Date().getFullYear() - 3}-${new Date().getFullYear()}`;

  for (const venue of venues.slice(0, 5)) {
    try {
      await sleep(400); // avoid burst rate-limiting across venue requests
      const papers = await searchPapers(keywords, {
        venue,
        year: yearFilter,
        limit: 25,
      });
      byVenue.set(venue, papers);
      for (const p of papers) {
        if (p.paperId && !seen.has(p.paperId)) {
          seen.add(p.paperId);
          allPapers.push(p);
        }
      }
    } catch (err) {
      console.error(`Venue search failed for ${venue}:`, err);
      byVenue.set(venue, []);
    }
  }

  return { papers: allPapers, byVenue };
}

/** Legacy function kept for backward compat */
export async function batchSearchByVenue(
  keywords: string[],
  venues: string[],
  yearRange: { from?: number; to?: number }
): Promise<Map<string, SemanticScholarPaper[]>> {
  const results = new Map<string, SemanticScholarPaper[]>();
  const yearFilter =
    yearRange.from && yearRange.to
      ? `${yearRange.from}-${yearRange.to}`
      : `${new Date().getFullYear() - 3}-${new Date().getFullYear()}`;

  for (const venue of venues) {
    try {
      const papers = await searchPapers(keywords, { venue, year: yearFilter, limit: 50 });
      results.set(venue, papers);
    } catch (err) {
      console.error(`Failed to search ${venue}:`, err);
      results.set(venue, []);
    }
  }

  return results;
}
