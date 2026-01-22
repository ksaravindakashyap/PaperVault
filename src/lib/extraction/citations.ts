/**
 * Citation extraction using two-engine pipeline:
 * 1. Primary: pdf-parse (fast, full text)
 * 2. Fallback: pdfjs-dist (bounded end-scan when pdf-parse fails)
 */
import { extractPDFFullText } from "./pdfText";
import { extractTextFromPagesPdfjs, getTotalPagesPdfjs } from "./pdfjsNode";

export interface CitationCandidate {
  raw: string;
  title?: string;
  authors?: string;
  year?: number;
  venue?: string;
  doi?: string;
  arxivId?: string;
  url?: string;
}

export interface CitationExtractionResult {
  citations: CitationCandidate[];
  debug: {
    foundHeader: boolean;
    startIndex: number;
    signals: string[];
    numPages: number;
    engine?: string; // "pdf-parse" or "pdfjs-fallback"
    pagesScanned?: number[]; // Pages scanned in pdfjs fallback
  };
}

export interface CitationExtractionOptions {
  minCitations?: number; // default 10
  maxCitations?: number; // default 200
}

const DEFAULT_OPTIONS: Required<CitationExtractionOptions> = {
  minCitations: 10,
  maxCitations: 200,
};

/**
 * Find the last occurrence of a regex in text
 */
function lastRegexIndex(
  text: string,
  re: RegExp
): { index: number; match: RegExpExecArray | null } {
  let last: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  const globalRe = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  while ((m = globalRe.exec(text)) !== null) {
    last = m;
  }
  return { index: last ? last.index : -1, match: last };
}

/**
 * Find dense cluster of [n] reference markers from the end
 */
function findBracketClusterStart(text: string, signals: string[]): number {
  // Look at tail region (last 40% of text)
  const tailStart = Math.floor(text.length * 0.6);
  const tail = text.slice(tailStart);

  const lines = tail.split("\n");
  // Tightened regexes: avoid matching years
  const bracketRefStartLine = /^\s*(?:\d{1,5}\s+)?\[\d{1,4}\]\s*/;
  // CRITICAL: Don't match years (19xx, 20xx), only 1-999
  const numericRefStartLine = /^\s*(?:\d{1,5}\s+)?(?!19\d{2}\.|20\d{2}\.)\d{1,3}\.\s+/;
  const numericAuthorLine = /^\s*(?:\d{1,5}\s+)?\d{1,3}\s+[A-Z]/;

  // Track line offsets and hits
  let offset = 0;
  const hitIndexes: number[] = [];
  
  for (const line of lines) {
    if (bracketRefStartLine.test(line) || 
        numericRefStartLine.test(line) || 
        numericAuthorLine.test(line)) {
      hitIndexes.push(offset);
    }
    offset += line.length + 1; // +1 for newline
  }

  signals.push(`Ref-start hits in tail: ${hitIndexes.length}`);

  // Need at least 3 hits to believe it's a references section (reduced from 6)
  if (hitIndexes.length < 3) {
    return -1;
  }

  // Find the start of the cluster (first hit among the last 20 hits)
  const clusterStartHit = hitIndexes[Math.max(0, hitIndexes.length - 20)];
  const absoluteIndex = tailStart + clusterStartHit;
  
  signals.push(`Bracket cluster start index: ${absoluteIndex}`);
  return absoluteIndex;
}

/**
 * Find references using pdfjs-dist bounded end-scan (fallback engine)
 */
async function findReferencesUsingPdfjs(
  fileKey: string,
  signals: string[]
): Promise<{ refsText: string; foundHeader: boolean; pagesScanned: number[] } | null> {
  const chunkSize = 2; // Scan 2 pages at a time
  const maxScanPages = 12; // Maximum pages to read

  try {
    // Get total pages
    const totalPages = await getTotalPagesPdfjs(fileKey);
    signals.push(`pdfjs: PDF has ${totalPages} pages`);

    if (totalPages === 0) {
      return null;
    }

    // Scan from end: [N-1,N], then [N-3,N-2], etc.
    const pagesToScan: number[] = [];
    let currentPage = totalPages;
    let pagesScanned = 0;

    // Build list of pages to scan (from end, working backwards)
    while (currentPage >= 1 && pagesScanned < maxScanPages) {
      const chunk: number[] = [];
      for (let i = 0; i < chunkSize && currentPage >= 1 && pagesScanned < maxScanPages; i++) {
        chunk.push(currentPage);
        currentPage--;
        pagesScanned++;
      }
      pagesToScan.unshift(...chunk); // Add to front to maintain order
    }

    signals.push(`pdfjs: Scanning pages ${pagesToScan.join(", ")} from end`);

    // Extract text from pages
    const result = await extractTextFromPagesPdfjs(fileKey, pagesToScan);
    const scannedText = result.text;
    const pagesUsed = result.pagesUsed;

    // Search for references header (line-number tolerant)
    const referencesHeaderRegex = /(?:\d{1,5}\s+)?(References|REFERENCES|Bibliography|BIBLIOGRAPHY)\b/i;
    const headerMatch = scannedText.match(referencesHeaderRegex);
    let foundHeader = false;
    let refsText = "";

    if (headerMatch && headerMatch.index !== undefined) {
      // Found header - extract from header position
      foundHeader = true;
      refsText = scannedText.substring(headerMatch.index + headerMatch[0].length);
      signals.push(`pdfjs: Found header at position ${headerMatch.index} in scanned text`);
    } else {
      // No header - look for bracket markers
      const bracketMarkerRegex = /\[\d+\]\s+/g;
      const matches = scannedText.matchAll(bracketMarkerRegex);
      const markerCount = Array.from(matches).length;

      signals.push(`pdfjs: No header found, marker count: ${markerCount}`);

      if (markerCount >= 6) {
        // Found dense cluster - find first marker and extract from there
        const firstMarkerMatch = scannedText.match(/\[\d+\]\s+/);
        if (firstMarkerMatch && firstMarkerMatch.index !== undefined) {
          refsText = scannedText.substring(firstMarkerMatch.index);
          signals.push(`pdfjs: Found bracket cluster at position ${firstMarkerMatch.index}`);
        } else {
          // Fallback: use all scanned text
          refsText = scannedText;
        }
      } else {
        // Not enough markers - return null to indicate failure
        signals.push(`pdfjs: Insufficient markers (${markerCount} < 6)`);
        return null;
      }
    }

    return {
      refsText: refsText.trim(),
      foundHeader,
      pagesScanned: pagesUsed,
    };
  } catch (error) {
    signals.push(`pdfjs: Error during extraction: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Extract citations from PDF using two-engine pipeline
 */
export async function extractCitationsFromPDF(
  fileKey: string,
  opts?: CitationExtractionOptions
): Promise<CitationExtractionResult> {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const signals: string[] = [];

  // ============================================================
  // ENGINE 1: pdf-parse (primary, fast)
  // ============================================================
  signals.push("engine=pdf-parse");

  const { text, numPages } = await extractPDFFullText(fileKey);
  signals.push(`PDF has ${numPages} pages, ${text.length} chars`);

  if (text.length === 0) {
    signals.push("pdf-parse: PDF text is empty, trying pdfjs fallback");
    // Fall through to pdfjs fallback
  } else {
    // Search from END for References heading (line-number tolerant)
    const referencesHeaderRegex = /(^|\n)\s*(?:\d{1,5}\s+)?(References|REFERENCES|Bibliography|BIBLIOGRAPHY)\s*(?=\n)/g;
    const { index: headerIdx, match: headerMatch } = lastRegexIndex(text, referencesHeaderRegex);

    let startIndex = -1;
    let foundHeader = false;

    if (headerIdx >= 0 && headerMatch) {
      startIndex = headerIdx + headerMatch[0].length;
      foundHeader = true;
      signals.push(`Found header: true`);
      signals.push(`Header last index: ${headerIdx}`);
    } else {
      // Fallback: find dense cluster of [n] markers from end
      signals.push(`Found header: false`);
      startIndex = findBracketClusterStart(text, signals);
      foundHeader = false;
    }

    if (startIndex !== -1) {
      // CRITICAL: Find where references END (before checklist/appendix)
      const textAfterStart = text.substring(startIndex);
      const stopHeadingRegex = /(^|\n)\s*(?:\d{1,5}\s+)?(NeurIPS.*Checklist|Paper Checklist|Reproducibility Checklist|Code of Ethics|Ethics Statement|Broader Impacts|Acknowledg(?:e)?ments|Appendix|Supplementary)\s*(\n|$)/gmi;
      const stopMatch = stopHeadingRegex.exec(textAfterStart);
      
      let endIndex: number;
      let stopHeadingFound = false;
      let stopHeadingLine = "";
      
      if (stopMatch && stopMatch.index !== undefined) {
        endIndex = startIndex + stopMatch.index;
        stopHeadingFound = true;
        stopHeadingLine = stopMatch[0].trim();
        signals.push(`Stop heading found: "${stopHeadingLine.substring(0, 50)}"`);
      } else {
        // No stop heading - cap at 120k chars
        endIndex = Math.min(text.length, startIndex + 120_000);
      }
      
      // Extract clean references slice
      const refText = text.slice(startIndex, endIndex);
      signals.push(`References slice: ${refText.length} chars (stopHeading: ${stopHeadingFound})`);

      // Parse citations from reference text
      const citations = parseCitationsFromText(refText, options, signals);
      signals.push(`Extracted ${citations.length} citations`);

      // If we got enough citations, return success
      if (citations.length >= 5) {
        return {
          citations,
          debug: {
            foundHeader,
            startIndex,
            signals,
            numPages,
            engine: "pdf-parse",
          },
        };
      } else {
        signals.push(`pdf-parse: Only found ${citations.length} citations (< 5), trying pdfjs fallback`);
      }
    } else {
      signals.push("pdf-parse: No References section found, trying pdfjs fallback");
    }
  }

  // ============================================================
  // ENGINE 2: pdfjs-dist fallback (bounded end-scan)
  // ============================================================
  signals.push("engine=pdfjs-fallback");

  const pdfjsResult = await findReferencesUsingPdfjs(fileKey, signals);

  if (!pdfjsResult) {
    signals.push("pdfjs-fallback: Failed to find references");
    return {
      citations: [],
      debug: {
        foundHeader: false,
        startIndex: -1,
        signals,
        numPages,
        engine: "pdfjs-fallback",
      },
    };
  }

  signals.push(`pdfjs-fallback: Found references, pages scanned: ${pdfjsResult.pagesScanned.join(", ")}`);
  signals.push(`pdfjs-fallback: Processing ${pdfjsResult.refsText.length} chars of references text`);

  // Parse citations from pdfjs-extracted text
  const citations = parseCitationsFromText(pdfjsResult.refsText, options, signals);
  signals.push(`Extracted ${citations.length} citations`);

  return {
    citations,
    debug: {
      foundHeader: pdfjsResult.foundHeader,
      startIndex: 0, // Not applicable for pdfjs (we extract specific pages)
      signals,
      numPages,
      engine: "pdfjs-fallback",
      pagesScanned: pdfjsResult.pagesScanned,
    },
  };
}

/**
 * Check if line is a checklist/non-citation line
 */
function isChecklistOrJunkLine(line: string): boolean {
  const junkPatterns = [
    /\bQuestion:\b/i,
    /\bAnswer:\b/i,
    /\bJustification:\b/i,
    /^\s*\d+\.\s*.*Question:\b/i,
    /^\s*Then navigate to\b/i,
    /\bSafeguards Question:\b/i,
    /\bLimitations Question:\b/i,
    /\bCode of ethics Question:\b/i,
    /\bClaims Question:\b/i,
    /\bReproducibility Question:\b/i,
    /\bBroader Impacts Question:\b/i,
    /\bI see the\b/i,
    /\bFirefox icon\b/i,
  ];

  for (const pattern of junkPatterns) {
    if (pattern.test(line)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a line looks like a reference (not checklist)
 */
function looksLikeReferenceLine(line: string): boolean {
  // Must contain at least one of these reference indicators
  const hasYear = /\b(19|20)\d{2}\b/.test(line);
  const hasArxiv = /arxiv/i.test(line);
  const hasDoi = /(doi|dx\.doi)/i.test(line);
  const hasUrl = /https?:\/\//i.test(line);
  const hasMultipleCommas = (line.match(/,/g) || []).length >= 2;
  const hasEtAl = /\bet al\.?\b/i.test(line);

  const hasReferenceIndicator = hasYear || hasArxiv || hasDoi || hasUrl || hasMultipleCommas || hasEtAl;

  // Must NOT contain checklist phrases
  const hasChecklistPhrase = /question:|answer:|justification:|then navigate|i see the|firefox icon/i.test(line);

  return hasReferenceIndicator && !hasChecklistPhrase;
}

/**
 * Parse author-year style references (NeurIPS, ACL, etc.)
 */
function parseAuthorYearReferences(
  lines: string[],
  options: Required<CitationExtractionOptions>,
  signals: string[]
): CitationCandidate[] {
  const refBlocks: string[] = [];
  let currentBlock = "";
  const matchedRefStarts: string[] = [];

  // Author-year pattern: line starts with author name(s) and contains year within first 160 chars
  const authorYearPattern = (line: string): boolean => {
    // Must start with capital letter (author name)
    if (!/^[A-Z]/.test(line.trim())) return false;
    
    // Must have comma in first 80 chars OR "et al" (author list indicator)
    const first80 = line.substring(0, 80);
    const hasComma = first80.includes(",");
    const hasEtAl = /\bet al\.?\b/i.test(first80);
    
    if (!hasComma && !hasEtAl) return false;
    
    // Must have year in first 160 chars
    const first160 = line.substring(0, 160);
    const hasYear = /\b(19|20)\d{2}\b/.test(first160);
    
    return hasYear;
  };

  for (const line of lines) {
    // Skip empty lines
    if (line.trim().length === 0) continue;
    
    // Skip pure line numbers
    if (/^\s*\d{1,5}\s*$/.test(line)) continue;
    
    // Skip checklist lines
    if (isChecklistOrJunkLine(line)) continue;
    
    // Check if this starts a new reference
    const isNewRef = authorYearPattern(line);
    
    if (isNewRef && matchedRefStarts.length < 5) {
      matchedRefStarts.push(line.substring(0, 80));
    }
    
    if (isNewRef && currentBlock) {
      // Save previous block
      refBlocks.push(currentBlock.trim());
      currentBlock = line;
      
      if (refBlocks.length >= options.maxCitations) {
        signals.push(`Reached max citations limit (${options.maxCitations})`);
        break;
      }
    } else if (isNewRef) {
      currentBlock = line;
    } else {
      // Continuation line
      currentBlock += " " + line;
    }
    
    // Stop at end markers
    if (isEndOfReferences(line)) {
      signals.push(`Detected end of references: "${line.substring(0, 50)}"`);
      break;
    }
  }

  // Add last block
  if (currentBlock && refBlocks.length < options.maxCitations) {
    refBlocks.push(currentBlock.trim());
  }

  signals.push(`Author-year mode: parsed ${refBlocks.length} blocks`);
  if (matchedRefStarts.length > 0) {
    signals.push(`First 5 ref-starts: ${matchedRefStarts.join(" | ")}`);
  }

  // Parse each block
  const citations: CitationCandidate[] = [];
  for (const block of refBlocks) {
    const citation = parseReferenceBlock(block);
    if (citation) {
      citations.push(citation);
    }
  }

  return citations;
}

/**
 * Parse citations from reference text
 */
function parseCitationsFromText(
  refText: string,
  options: Required<CitationExtractionOptions>,
  signals: string[]
): CitationCandidate[] {
  // Split into lines
  const allLines = refText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Filter out checklist/junk lines
  const lines = allLines.filter((line) => !isChecklistOrJunkLine(line));
  const filteredCount = allLines.length - lines.length;
  if (filteredCount > 0) {
    signals.push(`Filtered ${filteredCount} checklist/junk lines`);
  }

  // CRITICAL: Tightened regexes to avoid matching years like "2024."
  // Bracket style: [1], [2], etc.
  const bracketRefStartRegex = /^\s*(?:\d{1,5}\s+)?\[\d{1,4}\]\s*/;
  
  // Numeric style: 1., 2., etc. BUT NOT years (19xx., 20xx.)
  // Limit to 1-999 (1-3 digits) to avoid matching 4-digit years
  const numericRefStartRegex = /^\s*(?:\d{1,5}\s+)?(?!19\d{2}\.|20\d{2}\.)\d{1,3}\.\s+/;
  
  // Numeric with author: "1 Author" or "259 1 Author"
  const numericAuthorRefRegex = /^\s*(?:\d{1,5}\s+)?\d{1,3}\s+[A-Z]/;
  
  // Author-style starts: "Author, A." (for papers without numbered refs)
  const authorStartRegex = /^\s*(?:\d{1,5}\s+)?[A-Z][a-z]+,\s*[A-Z]\./;
  
  const pureLineNumber = /^\s*\d{1,5}\s*$/;

  // Stop heading detection for NeurIPS checklists and ethics sections
  const stopHeadingRegex = /^\s*(?:\d{1,5}\s+)?(NeurIPS.*Checklist|Paper Checklist|Checklist|Code of Ethics|Ethics Statement|Reproducibility Checklist|Broader Impacts|Responsible AI|Claims and Limitations)\b/i;

  // Track first few matched lines for debug
  const matchedRefStarts: string[] = [];
  let bracketHits = 0;
  let numericHits = 0;
  let stopHeadingTriggered = false;

  // First pass: count bracket and numeric hits to validate numbering reliability
  for (const line of lines) {
    if (pureLineNumber.test(line)) continue;
    
    if (bracketRefStartRegex.test(line)) {
      bracketHits++;
    } else if (numericRefStartRegex.test(line) || numericAuthorRefRegex.test(line)) {
      numericHits++;
    }
  }

  signals.push(`Bracket hits: ${bracketHits}, Numeric hits: ${numericHits}`);

  // Decide parsing strategy based on markers found
  const totalHits = bracketHits + numericHits;
  const useAuthorYearMode = bracketHits === 0 && numericHits < 5;
  
  if (useAuthorYearMode) {
    signals.push(`Using author-year parsing mode (bracketHits=0, numericHits=${numericHits})`);
    return parseAuthorYearReferences(lines, options, signals);
  }

  if (totalHits < 3) {
    signals.push(`Insufficient reference markers (${totalHits} < 3), trying author-year mode`);
    return parseAuthorYearReferences(lines, options, signals);
  }

  // Merge wrapped lines into reference blocks
  const refBlocks: string[] = [];
  let currentBlock = "";

  for (const line of lines) {
    // Skip pure line-number lines (e.g., "277")
    if (pureLineNumber.test(line)) {
      continue;
    }

    // Stop if we hit a checklist/ethics heading (after we have at least 3 blocks)
    if (stopHeadingRegex.test(line) && refBlocks.length >= 3) {
      stopHeadingTriggered = true;
      signals.push(`Stop heading triggered: "${line.substring(0, 60)}"`);
      break;
    }

    // Check if this line starts a new reference
    const isBracketRef = bracketRefStartRegex.test(line);
    // CRITICAL: Only use numeric splitting if line looks like a reference
    const isNumericRef = (numericRefStartRegex.test(line) || numericAuthorRefRegex.test(line)) && looksLikeReferenceLine(line);
    const isAuthorRef = authorStartRegex.test(line);
    const isNewRef = isBracketRef || isNumericRef || isAuthorRef;

    if (isNewRef && matchedRefStarts.length < 5) {
      matchedRefStarts.push(line.substring(0, 80));
    }

    if (isNewRef && currentBlock) {
      refBlocks.push(currentBlock.trim());
      currentBlock = line;

      // Cap at max citations
      if (refBlocks.length >= options.maxCitations) {
        signals.push(`Reached max citations limit (${options.maxCitations})`);
        break;
      }
    } else if (isNewRef) {
      currentBlock = line;
    } else {
      // Continuation line
      currentBlock += " " + line;
    }

    // Check for end markers (line-number tolerant)
    if (isEndOfReferences(line)) {
      signals.push(`Detected end of references: "${line.substring(0, 50)}"`);
      break;
    }
  }

  // Add last block
  if (currentBlock && refBlocks.length < options.maxCitations) {
    refBlocks.push(currentBlock.trim());
  }

  signals.push(`Parsed blocks: ${refBlocks.length}`);
  if (stopHeadingTriggered) {
    signals.push(`Stop heading triggered: true`);
  }
  if (matchedRefStarts.length > 0) {
    signals.push(`First 5 matched ref-starts: ${matchedRefStarts.join(" | ")}`);
  }

  // Parse each reference block
  const citations: CitationCandidate[] = [];

  for (const block of refBlocks) {
    const citation = parseReferenceBlock(block);
    if (citation) {
      citations.push(citation);
    }
  }

  return citations;
}

/**
 * Check if line indicates end of references (line-number tolerant)
 */
function isEndOfReferences(line: string): boolean {
  const endMarkers = [
    /^\s*(?:\d{1,5}\s+)?(Appendix|APPENDIX)\b/i,
    /^\s*(?:\d{1,5}\s+)?(Acknowledgments|ACKNOWLEDGMENTS|Acknowledgements|ACKNOWLEDGEMENTS)\b/i,
    /^\s*(?:\d{1,5}\s+)?(Supplementary|SUPPLEMENTARY)\b/i,
    /^\s*(?:\d{1,5}\s+)?(Biography|BIOGRAPHY)\b/i,
    // NeurIPS checklist and ethics sections
    /^\s*(?:\d{1,5}\s+)?(NeurIPS.*Checklist|Paper Checklist|Checklist)\b/i,
    /^\s*(?:\d{1,5}\s+)?(Code of Ethics|Ethics Statement)\b/i,
    /^\s*(?:\d{1,5}\s+)?(Reproducibility Checklist|Broader Impacts|Responsible AI)\b/i,
    /^\s*(?:\d{1,5}\s+)?(Claims and Limitations)\b/i,
  ];

  for (const marker of endMarkers) {
    if (marker.test(line)) {
      return true;
    }
  }

  return false;
}

/**
 * Parse a single reference block
 */
function parseReferenceBlock(block: string): CitationCandidate | null {
  if (block.length < 20) return null;

  const citation: CitationCandidate = {
    raw: block,
  };

  // Extract DOI
  const doiMatch = block.match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i);
  if (doiMatch) {
    citation.doi = doiMatch[0].replace(/[.,;)\]]+$/, "");
  }

  // Extract arXiv ID
  const arxivMatch =
    block.match(/\barXiv:\s*(\d{4}\.\d{4,5})(v\d+)?\b/i) ||
    block.match(/\b(\d{4}\.\d{4,5})(v\d+)?\b/);
  if (arxivMatch) {
    citation.arxivId = arxivMatch[1];
  }

  // Extract URL (with better trailing character stripping)
  const urlMatch = block.match(/https?:\/\/[^\s)]+/i);
  if (urlMatch) {
    citation.url = urlMatch[0].replace(/[).,;]+$/, "");
  }

  // Extract year
  const currentYear = new Date().getFullYear();
  const yearMatch = block.match(/\b(19[9]\d|20[0-2]\d)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year >= 1990 && year <= currentYear + 2) {
      citation.year = year;
    }
  }

  // Extract title (heuristic: text in quotes or between periods)
  const quotedTitleMatch = block.match(/"([^"]{10,})"/);
  if (quotedTitleMatch) {
    const candidateTitle = quotedTitleMatch[1].trim();
    // Don't use URLs as titles
    if (!candidateTitle.startsWith("http://") && !candidateTitle.startsWith("https://")) {
      citation.title = candidateTitle;
    }
  } else {
    // Try to extract title between first period after author and next period
    const segments = block.split(".");
    if (segments.length >= 2) {
      const possibleTitle = segments[1]?.trim();
      if (
        possibleTitle &&
        possibleTitle.length >= 10 &&
        possibleTitle.length <= 200 &&
        // Don't use URLs as titles
        !possibleTitle.startsWith("http://") &&
        !possibleTitle.startsWith("https://") &&
        // Must contain letters, not just numbers/punctuation
        /[a-zA-Z]{3,}/.test(possibleTitle)
      ) {
        citation.title = possibleTitle;
      }
    }
  }

  // Extract venue
  const venuePatterns = [
    /In\s+Proceedings\s+of\s+([^,.]+)/i,
    /In\s+([A-Z][^,.]{5,50}),/,
  ];

  for (const pattern of venuePatterns) {
    const venueMatch = block.match(pattern);
    if (venueMatch) {
      citation.venue = venueMatch[1].trim();
      break;
    }
  }

  return citation;
}
