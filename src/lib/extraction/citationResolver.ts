import { db } from "@/lib/db";
import type { CitationCandidate } from "./citations";

export interface ResolvedCitation extends CitationCandidate {
  targetPaperId?: string;
}

/**
 * Resolve citations to internal papers
 */
export async function resolveCitationTargets(
  citations: CitationCandidate[]
): Promise<ResolvedCitation[]> {
  const resolved: ResolvedCitation[] = [];

  for (const citation of citations) {
    const targetPaperId = await findMatchingPaper(citation);
    resolved.push({
      ...citation,
      targetPaperId,
    });
  }

  return resolved;
}

/**
 * Find a matching paper in the database
 */
async function findMatchingPaper(
  citation: CitationCandidate
): Promise<string | undefined> {
  // Try DOI match (highest confidence)
  if (citation.doi) {
    const normalized = normalizeDoi(citation.doi);
    
    // SQLite doesn't support case-insensitive mode on non-text columns
    // Get all papers with DOIs and match manually
    const papers = await db.paper.findMany({
      where: {
        doi: { not: null },
      },
      select: { id: true, doi: true },
    });

    const match = papers.find(
      (p) => p.doi && normalizeDoi(p.doi).toLowerCase() === normalized.toLowerCase()
    );
    
    if (match) return match.id;
  }

  // Try arXiv ID match
  if (citation.arxivId) {
    const papers = await db.paper.findMany({
      where: {
        arxivId: { not: null },
      },
      select: { id: true, arxivId: true },
    });

    const match = papers.find(
      (p) => p.arxivId && citation.arxivId && p.arxivId.toLowerCase() === citation.arxivId.toLowerCase()
    );
    
    if (match) return match.id;
  }

  // Try title match (lower confidence, fuzzy)
  if (citation.title && citation.title.length >= 20) {
    const paper = await findByTitleSimilarity(citation.title);
    if (paper) return paper.id;
  }

  return undefined;
}

/**
 * Normalize DOI for comparison
 */
function normalizeDoi(doi: string): string {
  return doi
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
    .trim();
}

/**
 * Find paper by title similarity
 */
async function findByTitleSimilarity(
  title: string
): Promise<{ id: string } | null> {
  const normalizedTitle = normalizeTitle(title);
  const tokens = new Set(normalizedTitle.split(/\s+/).filter((t) => t.length >= 3));

  if (tokens.size < 5) return null; // Too short to match reliably

  // Get all papers with titles
  const papers = await db.paper.findMany({
    where: {
      title: {
        not: null,
      },
    },
    select: {
      id: true,
      title: true,
    },
  });

  // Calculate token overlap
  let bestMatch: { id: string; score: number } | null = null;

  for (const paper of papers) {
    if (!paper.title) continue;

    const paperNormalized = normalizeTitle(paper.title);
    const paperTokens = new Set(paperNormalized.split(/\s+/).filter((t) => t.length >= 3));

    if (paperTokens.size < 5) continue;

    // Calculate Jaccard similarity
    const intersection = new Set([...tokens].filter((t) => paperTokens.has(t)));
    const score = intersection.size / Math.min(tokens.size, paperTokens.size);

    if (score >= 0.85 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { id: paper.id, score };
    }
  }

  // Only return if high confidence
  if (bestMatch && bestMatch.score >= 0.85) {
    return { id: bestMatch.id };
  }

  return null;
}

/**
 * Normalize title for comparison
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Remove punctuation
    .replace(/\s+/g, " ") // Collapse spaces
    .trim();
}
