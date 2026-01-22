import { VenueType } from "@prisma/client";
import { extractPDFText, getLines } from "./pdfText";
import { getProfileForVenue, ExtractionProfile } from "./profiles";
import { detectVenueFromText, generateMismatchNote } from "./detectVenue";

export interface ExtractedMetadata {
  title?: string;
  authors?: string;
  abstract?: string;
  doi?: string;
  arxivId?: string;
  year?: number;
  bibtex?: string;
  confidence: {
    title: number;
    authors: number;
    abstract: number;
    doi: number;
    arxivId: number;
    year: number;
  };
  venueDetection: {
    detected?: VenueType;
    mismatchNote?: string;
    confidence: number;
    signals: string[];
  };
  debug: {
    usedProfile: VenueType;
    textPages: number;
    signals: string[];
  };
}

export async function extractMetadata(
  fileKey: string,
  venueType: VenueType,
  useDetectedVenue: boolean = false
): Promise<ExtractedMetadata> {
  const signals: string[] = [];

  // Extract PDF text (limited to first 2 pages for speed)
  const pdfResult = await extractPDFText(fileKey, { firstPages: 2, lastPages: 0 });
  signals.push(`Extracted ${pdfResult.pagesExtracted} of ${pdfResult.numPages} pages`);

  const text = pdfResult.firstPages;
  const lines = getLines(text);

  // Detect venue from text
  const venueDetection = detectVenueFromText(text);
  signals.push(
    `Venue detection: ${venueDetection.detected || "none"} (confidence: ${Math.round(venueDetection.confidence * 100)}%)`
  );

  // Determine which profile to use
  let profileVenue = venueType;
  if (useDetectedVenue && venueDetection.detected) {
    profileVenue = venueDetection.detected;
    signals.push(`Using detected venue profile: ${profileVenue}`);
  }

  const profile = getProfileForVenue(profileVenue);

  // Extract DOI
  const doi = extractDOI(text, profile, signals);

  // Extract arXiv ID
  const arxivId = extractArXivId(text, profile, signals);

  // Extract abstract
  const abstract = extractAbstract(text, profile, signals);

  // Extract title
  const title = extractTitle(lines, profile, signals);

  // Extract authors (pass title for anchoring)
  const authors = extractAuthors(lines, text, title, profile, signals);

  // Extract year
  const year = extractYear(text, profile, signals);

  // Generate mismatch note if needed
  let mismatchNote: string | undefined;
  if (
    venueDetection.detected &&
    venueDetection.detected !== venueType &&
    venueDetection.confidence >= 0.8
  ) {
    mismatchNote = generateMismatchNote(
      venueType,
      venueDetection.detected,
      venueDetection.confidence
    );
  }

  const result: ExtractedMetadata = {
    title,
    authors,
    abstract,
    doi,
    arxivId,
    year,
    confidence: {
      title: title ? 0.7 : 0,
      authors: authors ? 0.6 : 0,
      abstract: abstract ? 0.8 : 0,
      doi: doi ? 0.9 : 0,
      arxivId: arxivId ? 0.9 : 0,
      year: year ? 0.7 : 0,
    },
    venueDetection: {
      detected: venueDetection.detected,
      mismatchNote,
      confidence: venueDetection.confidence,
      signals: venueDetection.signals,
    },
    debug: {
      usedProfile: profileVenue,
      textPages: pdfResult.pagesExtracted,
      signals,
    },
  };

  return result;
}

function extractDOI(
  text: string,
  profile: ExtractionProfile,
  signals: string[]
): string | undefined {
  for (const regex of profile.doiRegexes) {
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      // Clean up DOI (remove trailing punctuation)
      const doi = matches[0].replace(/[.,;:)\]}]+$/, "");
      signals.push(`Found DOI: ${doi}`);
      return doi;
    }
  }
  signals.push("No DOI found");
  return undefined;
}

function extractArXivId(
  text: string,
  profile: ExtractionProfile,
  signals: string[]
): string | undefined {
  for (const regex of profile.arxivRegexes) {
    const matches = Array.from(text.matchAll(regex));
    if (matches.length > 0) {
      const arxivId = matches[0][1]; // First capture group
      signals.push(`Found arXiv ID: ${arxivId}`);
      return arxivId;
    }
  }
  signals.push("No arXiv ID found");
  return undefined;
}

function extractAbstract(
  text: string,
  profile: ExtractionProfile,
  signals: string[]
): string | undefined {
  // Find abstract start
  let abstractStart = -1;
  for (const regex of profile.abstractRegexes) {
    const match = text.match(regex);
    if (match && match.index !== undefined) {
      abstractStart = match.index + match[0].length;
      signals.push(`Found Abstract header at position ${match.index}`);
      break;
    }
  }

  if (abstractStart === -1) {
    signals.push("No Abstract header found");
    return undefined;
  }

  // Find where abstract ends - check ALL stop regexes and take the earliest match
  const textAfterAbstract = text.substring(abstractStart);
  let abstractEnd = textAfterAbstract.length;
  let stopMarker: string | undefined;

  for (const regex of profile.stopRegexes) {
    const match = textAfterAbstract.match(regex);
    if (match && match.index !== undefined && match.index < abstractEnd) {
      abstractEnd = match.index;
      stopMarker = match[0].trim();
    }
  }

  if (stopMarker) {
    signals.push(`Abstract ends at: ${stopMarker}`);
  }

  // Extract candidate abstract
  let abstract = textAfterAbstract.substring(0, abstractEnd).trim();

  // Remove common artifacts
  abstract = abstract
    .replace(/^\s*\n+/, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Apply citation-based trim for intro bleed (if no explicit stop marker found)
  if (!stopMarker && abstract.length > 700) {
    abstract = trimIntroBleed(abstract, signals);
  }

  if (abstract.length < 50) {
    signals.push("Abstract too short, discarding");
    return undefined;
  }

  if (abstract.length > 3000) {
    abstract = abstract.substring(0, 3000);
    signals.push("Abstract truncated to 3000 chars");
  }

  return abstract;
}

/**
 * Trim intro paragraph bleed from abstract using citation heuristics
 */
function trimIntroBleed(abstract: string, signals: string[]): string {
  // Citation patterns
  const citationPatterns = [
    // Parenthetical citations with year: (Author, 2023) or (Author et al., 2023)
    /\([^)]*\b(19|20)\d{2}\b[^)]*\)/g,
    // et al. with year: "et al., 2023" or "et al. 2023"
    /\bet al\.?,?\s*(19|20)\d{2}\b/gi,
    // [1] style citations
    /\[\d+\]/g,
  ];

  // Find all citation matches
  const citations: Array<{ index: number; match: string }> = [];
  for (const pattern of citationPatterns) {
    const matches = abstract.matchAll(pattern);
    for (const match of matches) {
      if (match.index !== undefined) {
        citations.push({ index: match.index, match: match[0] });
      }
    }
  }

  // If we have 2+ citations and length > 700, trim at first citation after char 400
  if (citations.length >= 2 && abstract.length > 700) {
    const lateCitations = citations.filter((c) => c.index > 400);
    if (lateCitations.length > 0) {
      const trimPoint = lateCitations[0].index;
      // Find previous sentence or paragraph boundary
      const beforeCitation = abstract.substring(0, trimPoint);
      const lastPeriod = beforeCitation.lastIndexOf(".");
      const lastNewline = beforeCitation.lastIndexOf("\n");
      const cutPoint = Math.max(lastPeriod, lastNewline);

      if (cutPoint > 400) {
        abstract = abstract.substring(0, cutPoint + 1).trim();
        signals.push(
          `Trimmed intro bleed at citation (${citations.length} citations found)`
        );
      }
    }
  }

  // Also check for common intro starters that indicate body text
  const introStarters = [
    /\bThe advent of\b/i,
    /\bIn recent years,?\s/i,
    /\bRecent advances in\b/i,
    /\bWith the rise of\b/i,
  ];

  for (const pattern of introStarters) {
    const match = abstract.match(pattern);
    if (match && match.index !== undefined && match.index > 400) {
      // Cut before this intro starter
      const beforeStarter = abstract.substring(0, match.index);
      const lastPeriod = beforeStarter.lastIndexOf(".");
      if (lastPeriod > 300) {
        abstract = abstract.substring(0, lastPeriod + 1).trim();
        signals.push(
          `Trimmed intro starter at: "${match[0].substring(0, 20)}..."`
        );
        break;
      }
    }
  }

  return abstract;
}

function extractTitle(
  lines: string[],
  profile: ExtractionProfile,
  signals: string[]
): string | undefined {
  if (profile.titleStrategy === "topBlock" || profile.titleStrategy === "heuristic") {
    return extractTitleWithScoring(lines, signals);
  }

  signals.push("Title extraction strategy not implemented for this profile");
  return undefined;
}

/**
 * Extract title with robust filtering and scoring
 */
function extractTitleWithScoring(
  lines: string[],
  signals: string[]
): string | undefined {
  // Take first 40 lines from top of document
  const topLines = lines.slice(0, 40);

  // Filter out junk lines
  const filteredLines: Array<{ line: string; idx: number }> = [];
  let filteredCount = 0;

  for (let i = 0; i < topLines.length; i++) {
    const line = topLines[i];
    const lower = line.toLowerCase();

    // EXCLUDE if matches any junk pattern
    if (
      // URLs and emails
      /(https?:\/\/|www\.|@|\.edu|\.org|\.com)/i.test(line) ||
      // Conference boilerplate
      /(proceedings of|usenix security symposium|neurips|icml|iclr|emnlp|naacl|acl|chi|copyright|©)/i.test(
        lower
      ) ||
      // Affiliations and institutions
      /(university|institute|laboratory|dept\.|department|school of|college of|council|zentrum|cispa|eth zurich)/i.test(
        lower
      ) ||
      // Too short or numeric
      line.length < 6 ||
      /^\s*\d+\s*$/.test(line) ||
      // Contains semicolons (common in author/affiliation blocks)
      line.includes(";") ||
      // Excessive commas (4+)
      (line.match(/,/g) || []).length >= 4 ||
      // Author patterns: "and" or "et al" with commas
      (/\b(and|et al\.?)\b/i.test(line) && line.includes(",")) ||
      // Page headers/footers
      /^(page|vol\.|volume)\s+\d+/i.test(line) ||
      lower.includes("preprint") ||
      lower.includes("arxiv")
    ) {
      filteredCount++;
      continue;
    }

    filteredLines.push({ line, idx: i });
  }

  signals.push(`Filtered ${filteredCount} junk lines from top ${topLines.length}`);

  if (filteredLines.length === 0) {
    signals.push("No title candidates after filtering");
    return undefined;
  }

  // Generate title candidates (single-line and two-line)
  interface TitleCandidate {
    text: string;
    score: number;
    lineCount: number;
  }

  const candidates: TitleCandidate[] = [];

  // Single-line candidates
  for (const { line } of filteredLines) {
    const score = scoreTitleCandidate(line, 1);
    candidates.push({ text: line, score, lineCount: 1 });
  }

  // Two-line candidates (adjacent lines)
  for (let i = 0; i < filteredLines.length - 1; i++) {
    const line1 = filteredLines[i].line;
    const line2 = filteredLines[i + 1].line;

    // Check if line2 is a valid continuation
    if (isValidTitleContinuation(line2)) {
      const combined = `${line1} ${line2}`;

      // Allow up to 300 chars for multi-line titles
      if (line1.length >= 10 && line2.length >= 10 && combined.length <= 300) {
        const score = scoreTitleCandidate(combined, 2);
        candidates.push({ text: combined, score, lineCount: 2 });
      }
    }
  }

  // Three-line candidates (for very long titles like AidFuzzer)
  for (let i = 0; i < filteredLines.length - 2; i++) {
    const line1 = filteredLines[i].line;
    const line2 = filteredLines[i + 1].line;
    const line3 = filteredLines[i + 2].line;

    // Check if both line2 and line3 are valid continuations
    if (isValidTitleContinuation(line2) && isValidTitleContinuation(line3)) {
      const combined = `${line1} ${line2} ${line3}`;

      // Allow up to 400 chars for 3-line titles
      if (line1.length >= 10 && line2.length >= 10 && line3.length >= 10 && combined.length <= 400) {
        const score = scoreTitleCandidate(combined, 3);
        candidates.push({ text: combined, score, lineCount: 3 });
      }
    }
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    signals.push("No scored candidates");
    return undefined;
  }

  // Prefer multi-line candidates if score is competitive
  const best = candidates[0];
  const bestSingleLine = candidates.find((c) => c.lineCount === 1);
  const bestTwoLine = candidates.find((c) => c.lineCount === 2);
  const bestThreeLine = candidates.find((c) => c.lineCount === 3);

  let selected = best;

  // Prefer 3-line if it's competitive (within 8 points of best)
  if (bestThreeLine && bestThreeLine.score >= best.score - 8) {
    selected = bestThreeLine;
    signals.push(
      `Preferring 3-line title (score: ${bestThreeLine.score})`
    );
  }
  // Else prefer 2-line if within 5 points of best 1-line
  else if (
    bestTwoLine &&
    bestSingleLine &&
    bestTwoLine.score >= bestSingleLine.score - 5
  ) {
    selected = bestTwoLine;
    signals.push(
      `Preferring 2-line title (score: ${bestTwoLine.score} vs 1-line: ${bestSingleLine.score})`
    );
  }

  // Must meet minimum score threshold
  if (selected.score < 10) {
    signals.push(
      `Best candidate score too low: ${selected.score} (threshold: 10)`
    );
    return undefined;
  }

  // Post-process title
  let title = selected.text
    .trim()
    // Remove hyphenation artifacts from line breaks
    .replace(/([a-z])-\s+([a-z])/gi, "$1$2")
    .replace(/\s+/g, " ") // collapse spaces
    .replace(/[.,;!?]+$/, ""); // strip trailing punctuation (but keep colons)

  // Strip ISBN-like patterns at the start
  title = title.replace(/^\s*(97[89][- ]?\d[- ]?\d{2,6}[- ]?\d{2,6}[- ]?\d{1,3}[- ]?\d)\s+/i, "");
  
  // Strip standalone 3-6 digit conference artifacts at start (e.g., "978-1-...")
  title = title.replace(/^\s*\d{3,6}[-\s]+/,  "");

  // CRITICAL: Do NOT truncate title in storage - store full title
  // UI can truncate for display if needed
  if (title.length > 500) {
    // Only cap at extreme length to prevent abuse
    signals.push(`Title very long (${title.length} chars), storing full title`);
  }

  signals.push(
    `Chose ${selected.lineCount}-line title (score: ${selected.score}): ${title.substring(0, 60)}...`
  );

  return title;
}

/**
 * Check if a line is a valid title continuation (not authors/affiliations)
 */
function isValidTitleContinuation(line: string): boolean {
  const lower = line.toLowerCase();

  // Must have at least 3 words
  const words = line.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w));
  if (words.length < 3) return false;

  // Should NOT be junk
  if (
    /(university|institute|laboratory|dept\.|department|@|\.edu|\.org|proceedings)/i.test(
      lower
    )
  ) {
    return false;
  }

  // Should NOT have excessive commas (author list)
  if ((line.match(/,/g) || []).length >= 3) return false;

  // Should start with capital letter (title continuation)
  if (!/^[A-Z]/.test(line)) return false;

  return true;
}

/**
 * Score a title candidate (higher = better)
 * @param lineCount - 1 for single-line, 2 for two-line, 3 for three-line candidates
 */
function scoreTitleCandidate(text: string, lineCount: number): number {
  let score = 0;

  const len = text.length;

  // Length scoring: prefer 30-140 for single-line, 40-220 for multi-line, 60-350 for 3-line
  if (lineCount === 3) {
    // Three-line titles (very long titles like AidFuzzer)
    if (len >= 80 && len <= 350) {
      score += 30; // Bonus for good 3-line length
    } else if (len >= 60 && len <= 400) {
      score += 20;
    }
  } else if (lineCount === 2) {
    // Multi-line titles are typically longer
    if (len >= 40 && len <= 220) {
      score += 25; // Bonus for good multi-line length
    } else if (len >= 30 && len <= 280) {
      score += 15;
    }
  } else {
    // Single-line titles
    if (len >= 30 && len <= 140) {
      score += 20;
    } else if (len >= 15 && len <= 180) {
      score += 10;
    } else if (len < 15 || len > 200) {
      score -= 10;
    }
  }

  // Title case heuristic: count words starting with uppercase
  const words = text.split(/\s+/);
  const titleCaseWords = words.filter(
    (w) => w.length > 0 && /^[A-Z]/.test(w)
  ).length;
  const titleCaseRatio = titleCaseWords / Math.max(words.length, 1);

  if (titleCaseRatio > 0.5) {
    score += 15;
  } else if (titleCaseRatio > 0.3) {
    score += 5;
  }

  // Penalize excessive punctuation
  const commaCount = (text.match(/,/g) || []).length;
  const semicolonCount = (text.match(/;/g) || []).length;

  if (semicolonCount > 0) {
    score -= 20; // Strong penalty
  }
  if (commaCount >= 3) {
    score -= 10 * commaCount;
  } else if (commaCount === 1 || commaCount === 2) {
    // Acceptable for titles like "X: Y" or "X, Y, and Z"
    score += 0;
  }

  // Penalize year patterns (unless clearly part of title)
  if (/\b(19|20)\d{2}\b/.test(text) && commaCount >= 1) {
    score -= 10; // Likely author with year
  }

  // Penalize lines with "and" + commas (author lists)
  if (/\band\b/i.test(text) && commaCount >= 2) {
    score -= 15;
  }

  // Penalize "et al"
  if (/\bet al\.?\b/i.test(text)) {
    score -= 20;
  }

  // Bonus for colon or dash (common in titles: "X: A Study on Y")
  if ((text.includes(":") || text.includes("—") || text.includes("-")) && commaCount <= 1) {
    score += 8;
  }

  // Bonus for multi-line titles (they're often the actual title split across lines)
  if (lineCount === 2) {
    score += 10;
  } else if (lineCount === 3) {
    score += 15; // Extra bonus for 3-line (very long titles like USENIX)
  }

  return score;
}

function extractAuthors(
  lines: string[],
  text: string,
  title: string | undefined,
  profile: ExtractionProfile,
  signals: string[]
): string | undefined {
  if (
    profile.authorStrategy === "betweenTitleAndAbstract" ||
    profile.authorStrategy === "heuristic"
  ) {
    // Use extracted title as anchor
    if (!title) {
      signals.push("Cannot extract authors: no title provided");
      return undefined;
    }

    // Create normalized prefix from title (first 8-12 words, lowercased, punctuation stripped)
    const titleWords = title
      .toLowerCase()
      .replace(/[.,;:!?()[\]{}]/g, " ") // Strip punctuation
      .split(/\s+/)
      .filter((w) => w.length > 0)
      .slice(0, 12); // Take first 12 words max
    const titlePrefix = titleWords.slice(0, Math.min(12, titleWords.length)).join(" ");

    // Find title position using normalized prefix search in lines
    let titleLineIdx = -1;
    for (let i = 0; i < Math.min(40, lines.length); i++) {
      const lineNormalized = lines[i]
        .toLowerCase()
        .replace(/[.,;:!?()[\]{}]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 0)
        .slice(0, 12)
        .join(" ");

      if (lineNormalized.includes(titlePrefix) || titlePrefix.includes(lineNormalized.substring(0, titlePrefix.length))) {
        titleLineIdx = i;
        signals.push(`Found title at line ${i} using normalized prefix`);
        break;
      }
    }

    if (titleLineIdx === -1) {
      // Title not found - check for anonymous, otherwise return null (don't block)
      for (const line of lines.slice(0, 20)) {
        if (/anonymous/i.test(line)) {
          signals.push("Cannot locate title, but detected anonymous paper");
          return "Anonymous Author(s)";
        }
      }
      signals.push("Cannot locate title in text for author extraction (using normalized prefix)");
      return undefined;
    }

    // Find title position in text (use line-based approach)
    // Build text up to title line to get approximate position
    let textBeforeTitle = "";
    for (let i = 0; i < titleLineIdx; i++) {
      textBeforeTitle += lines[i] + "\n";
    }
    const titleIdx = textBeforeTitle.length;

    // Find abstract position (stop marker) - try multiple patterns
    const textAfterTitle = text.substring(titleIdx + title.length);
    // Try multiple abstract patterns (case-insensitive, with optional colon)
    const abstractMatch = textAfterTitle.match(/\b(Abstract|ABSTRACT|Summary|SUMMARY)\s*:?\s*\n/i);
    
    if (!abstractMatch || abstractMatch.index === undefined) {
      // Fallback: look for common section headers that come after authors
      const fallbackMatch = textAfterTitle.match(/\b(Keywords|CCS Concepts|Index Terms|1\s+Introduction|Introduction|Introduction:|Background)\b/i);
      if (fallbackMatch && fallbackMatch.index !== undefined) {
        signals.push(`No Abstract found, using fallback marker: ${fallbackMatch[0]}`);
        const textBetween = textAfterTitle.substring(0, fallbackMatch.index);
        const candidateLines = getLines(textBetween);
        return extractAuthorsFromLines(candidateLines, title, signals);
      }
      signals.push("Cannot extract authors: no Abstract or section marker found after title");
      return undefined;
    }

    // Get text between title and abstract
    const textBetween = textAfterTitle.substring(0, abstractMatch.index);
    const candidateLines = getLines(textBetween);

    signals.push(`Author anchor: found ${candidateLines.length} lines between title and abstract`);

    return extractAuthorsFromLines(candidateLines, title, signals);
  }

  signals.push("Author extraction strategy not implemented");
  return undefined;
}

/**
 * Extract authors from candidate lines (shared logic)
 */
function extractAuthorsFromLines(
  candidateLines: string[],
  title: string | undefined,
  signals: string[]
): string | undefined {
  // Collect author lines with stop conditions
  const authorLines: string[] = [];
  const titleLower = title?.toLowerCase() || "";

  for (const line of candidateLines) {
    // Stop if we hit common section headers
    if (/^\s*(Keywords|CCS Concepts|Index Terms|1\s+Introduction|Introduction|Introduction:|Background)\b/i.test(line)) {
      signals.push(`Stopped at section header: ${line.substring(0, 30)}`);
      break;
    }

    // Stop if blank line after we have at least one candidate
    if (line.trim().length === 0 && authorLines.length > 0) {
      break;
    }

    // Check for anonymous author
    if (/anonymous/i.test(line)) {
      signals.push("Detected anonymous paper");
      return "Anonymous Author(s)";
    }

    const lower = line.toLowerCase();

    // Filter out invalid lines (less strict)
    if (/(https?:\/\/|www\.|@)/i.test(line)) {
      continue; // URLs/emails
    }
    if (/(proceedings|conference|symposium|workshop|copyright|neurips|icml|iclr|usenix|ccs|ndss)/i.test(lower)) {
      continue; // Venue boilerplate
    }
    // Less strict affiliation filter - only if line is mostly affiliation
    if (/(university|institute|laboratory|department|school|center|centre|eth|cispa|gmbh|inc\.|llc)/i.test(lower) && 
        line.length < 30 && !/[A-Z][a-z]+\s+[A-Z]/.test(line)) {
      continue; // Short affiliation-only lines
    }
    if (line.length > 200) { // Increased from 140
      continue; // Too long
    }
    if ((line.match(/,/g) || []).length >= 8) { // Increased from 6
      continue; // Too many commas
    }
    if (line.includes(";") && !/[A-Z][a-z]+,\s*[A-Z]/.test(line)) {
      continue; // Semicolons (unless it's author format)
    }
    if (titleLower && (titleLower.includes(lower) || lower.includes(titleLower))) {
      signals.push(`Skipping line that contains title: ${line.substring(0, 40)}`);
      continue; // Don't copy title as authors
    }
    if (line.length < 3) { // Reduced from 5
      continue; // Too short
    }

    // Accept lines that look like author names (Last, First or Last First format)
    const looksLikeAuthor = /[A-Z][a-z]+(\s+[A-Z]\.?)?(\s+[A-Z][a-z]+)?/.test(line);
    const hasComma = line.includes(",");
    
    // If it doesn't look like an author and has no comma, might be affiliation - skip
    if (!looksLikeAuthor && !hasComma && line.length > 50) {
      continue;
    }

    authorLines.push(line);

    // Stop after collecting 5 lines (increased from 4)
    if (authorLines.length >= 5) {
      break;
    }
  }

  if (authorLines.length === 0) {
    signals.push("No valid author lines found after filtering");
    return undefined;
  }

  // Join author lines
  let authors = authorLines.join(", ");

  // Strip trailing ", Affiliation" if present
  authors = authors.replace(/,\s*Affiliation\s*$/i, "");

  signals.push(`Extracted authors: ${authors.substring(0, 80)}...`);
  return authors;
}

function extractYear(
  text: string,
  profile: ExtractionProfile,
  signals: string[]
): number | undefined {
  // Search for 4-digit years between 1990 and current year + 1
  const currentYear = new Date().getFullYear();
  const yearRegex = /\b(19\d{2}|20[0-2]\d)\b/g;
  const matches = Array.from(text.matchAll(yearRegex));

  if (matches.length === 0) {
    signals.push("No year found");
    return undefined;
  }

  // Filter valid years
  const validYears = matches
    .map((m) => parseInt(m[1], 10))
    .filter((y) => y >= 1990 && y <= currentYear + 1);

  if (validYears.length === 0) {
    signals.push("No valid years found");
    return undefined;
  }

  // Prefer the most recent year (closest to current)
  const year = validYears.sort((a, b) => b - a)[0];
  signals.push(`Extracted year: ${year}`);
  return year;
}
