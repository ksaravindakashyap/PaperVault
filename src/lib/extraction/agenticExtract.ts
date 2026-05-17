/**
 * Agentic document extraction pipeline.
 *
 * Instead of static regex patterns, this uses an iterative agent loop:
 * 1. Initial LLM extraction — read full text, extract all metadata fields
 * 2. Self-validation — agent verifies each field against the source text
 * 3. Targeted re-extraction — for any field that fails validation, a focused
 *    second LLM call zooms into the relevant section
 * 4. Merge — best-confidence result wins per field
 *
 * This handles unusual layouts, multi-column PDFs, anonymous papers, and
 * formats that break regex heuristics.
 */
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.NVIDIA_NIM_API_KEY,
  baseURL: process.env.NVIDIA_NIM_BASE_URL,
});

const MODEL = process.env.LLM_MODEL || "stepfun-ai/step-3.5-flash";

export interface AgenticExtractedMetadata {
  title?: string;
  authors?: string;
  abstract?: string;
  year?: number;
  doi?: string;
  arxivId?: string;
  confidence: "high" | "medium" | "low";
  source: "llm" | "llm+retry" | "llm+fallback";
  validationNotes: string[];
}

interface RawLLMResult {
  title?: string;
  authors?: string | string[] | Array<{ name: string }>;
  abstract?: string;
  year?: number | string;
  doi?: string;
  arxivId?: string;
}

// ─────────────────────────────────────────────
// Step 1: Initial broad extraction
// ─────────────────────────────────────────────
async function initialExtraction(text: string, venueType: string): Promise<RawLLMResult> {
  const prompt = `Extract metadata from this scientific paper (venue: ${venueType}).

Return ONLY valid JSON with these keys:
{
  "title": "full paper title — not the venue/conference name, not a section header",
  "authors": "comma-separated author names ONLY — no affiliations, no emails, no superscripts",
  "abstract": "verbatim abstract text — stop before Introduction, Keywords, or CCS Concepts",
  "year": 2024,
  "doi": "10.XXXX/..." or null,
  "arxivId": "YYMM.NNNNN" or null
}

Rules:
- authors must be ONLY personal names (First Last or Last, First). Exclude institutions, labs, countries.
- If the paper is anonymous, set authors to "Anonymous Author(s)".
- abstract must be the actual abstract paragraph, verbatim.
- doi must start with "10." or be null.
- arxivId must match pattern \\d{4}.\\d{4,5} or be null.

Text (first pages):
===
${text.slice(0, 6500)}
===`;

  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are a precise scientific metadata extractor. Return only valid JSON, no explanations." },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
    max_tokens: 1200,
  });

  return JSON.parse(res.choices[0].message.content || "{}");
}

// ─────────────────────────────────────────────
// Step 2: Self-validation — check extracted fields against source text
// ─────────────────────────────────────────────
interface ValidationResult {
  titleOk: boolean;
  authorsOk: boolean;
  abstractOk: boolean;
  notes: string[];
}

function selfValidate(raw: RawLLMResult, sourceText: string): ValidationResult {
  const notes: string[] = [];
  const lowerSource = sourceText.toLowerCase();

  // Title validation: first 6 words should appear somewhere in the text
  let titleOk = false;
  if (typeof raw.title === "string" && raw.title.length > 10) {
    const titleWords = raw.title.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3).slice(0, 6);
    const matchCount = titleWords.filter((w) => lowerSource.includes(w)).length;
    titleOk = matchCount >= Math.min(4, titleWords.length);
    if (!titleOk) notes.push(`title validation failed (${matchCount}/${titleWords.length} key words found)`);
  } else {
    notes.push("title missing or too short");
  }

  // Author validation: no institutional keywords, looks like names
  let authorsOk = false;
  const authorsStr = normalizeAuthors(raw.authors);
  if (authorsStr && authorsStr.length > 2) {
    const hasInstitution = /(university|institute|laboratory|department|school|corp|inc\.|llc|gmbh|\bedu\b)/i.test(authorsStr);
    const looksLikeName = /[A-Z][a-z]/.test(authorsStr);
    authorsOk = !hasInstitution && looksLikeName;
    if (!authorsOk) notes.push("authors contain institutional names — needs refinement");
  } else {
    notes.push("authors missing");
  }

  // Abstract validation: must be ≥40 words and a substantial portion should appear in source
  let abstractOk = false;
  if (typeof raw.abstract === "string") {
    const wordCount = raw.abstract.split(/\s+/).length;
    const firstSentence = raw.abstract.split(/[.!?]/)[0].toLowerCase().slice(0, 60);
    const appearsInSource = firstSentence.length > 15 && lowerSource.includes(firstSentence.slice(0, 40));
    abstractOk = wordCount >= 40 && appearsInSource;
    if (!abstractOk) notes.push(`abstract validation failed (${wordCount} words, appears: ${appearsInSource})`);
  } else {
    notes.push("abstract missing");
  }

  return { titleOk, authorsOk, abstractOk, notes };
}

// ─────────────────────────────────────────────
// Step 3: Targeted re-extraction for failed fields
// ─────────────────────────────────────────────
async function targetedRefinement(
  sourceText: string,
  failedFields: string[],
  previousResult: RawLLMResult
): Promise<Partial<RawLLMResult>> {
  const fieldDescriptions: Record<string, string> = {
    title: "Find the paper TITLE only (not the venue/conference name). It appears near the top, usually in large text. Exclude boilerplate like 'Proceedings of...'",
    authors:
      "Find only the AUTHOR NAMES (personal names like 'John Smith' or 'J. Smith'). Exclude universities, labs, countries, email addresses. List all authors comma-separated.",
    abstract:
      "Find the ABSTRACT paragraph. It starts right after the word 'Abstract' and ends before 'Introduction', 'Keywords', or '1.' Return the full abstract text verbatim.",
  };

  const instructions = failedFields.map((f) => `${f.toUpperCase()}: ${fieldDescriptions[f] || f}`).join("\n");
  const previous = Object.fromEntries(
    failedFields.map((f) => [f, (previousResult as Record<string, unknown>)[f] || "not found"])
  );

  const prompt = `The previous extraction had issues with these fields: ${failedFields.join(", ")}.

Previous (possibly wrong) values:
${JSON.stringify(previous, null, 2)}

Instructions for each failed field:
${instructions}

Look more carefully at the text below and return ONLY a JSON object with the corrected fields.

Text:
===
${sourceText.slice(0, 7000)}
===`;

  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are a precise field extractor. Return only valid JSON with just the requested fields." },
      { role: "user", content: prompt },
    ],
    temperature: 0.05,
    response_format: { type: "json_object" },
    max_tokens: 800,
  });

  return JSON.parse(res.choices[0].message.content || "{}");
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function normalizeAuthors(raw: RawLLMResult["authors"]): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") return cleanAuthors(raw);
  if (Array.isArray(raw)) {
    return cleanAuthors(
      raw
        .map((a) => (typeof a === "string" ? a : (a as { name?: string })?.name || ""))
        .filter(Boolean)
        .join(", ")
    );
  }
  return undefined;
}

function cleanAuthors(raw: string): string {
  return raw
    .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰†‡§¶*⊕]+/g, "")
    .replace(/\S+@\S+\.\S+/g, "")
    .replace(/\b(University|Universit[äéè]t|Institute|Institut|Laboratory|Department|Dept|School|College|Corp|Inc|LLC|Ltd|GmbH|CISPA|ETH|MIT|CMU|UCB|UCLA|Stanford|Berkeley|Google|Microsoft|Meta|OpenAI|DeepMind|IBM|Amazon|Apple)\b[^,]*/gi, "")
    .replace(/[\[{][^\]}\n]*[\]}]/g, "")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .trim();
}

function parseYear(raw: number | string | undefined): number | undefined {
  if (typeof raw === "number" && raw >= 1990 && raw <= new Date().getFullYear() + 1) return raw;
  if (typeof raw === "string") {
    const n = parseInt(raw, 10);
    if (n >= 1990 && n <= new Date().getFullYear() + 1) return n;
  }
  return undefined;
}

// ─────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────
export async function agenticExtractMetadata(
  rawText: string,
  venueType: string
): Promise<AgenticExtractedMetadata> {
  const validationNotes: string[] = [];

  // Step 1: Initial extraction
  let extracted: RawLLMResult;
  try {
    extracted = await initialExtraction(rawText, venueType);
  } catch (err) {
    return { confidence: "low", source: "llm+fallback", validationNotes: [`LLM call failed: ${err}`] };
  }

  // Step 2: Self-validation
  const validation = selfValidate(extracted, rawText);
  validationNotes.push(...validation.notes);

  // Step 3: Targeted re-extraction for failed fields
  const failedFields = [
    !validation.titleOk && "title",
    !validation.authorsOk && "authors",
    !validation.abstractOk && "abstract",
  ].filter(Boolean) as string[];

  let source: AgenticExtractedMetadata["source"] = "llm";
  if (failedFields.length > 0) {
    source = "llm+retry";
    try {
      const refined = await targetedRefinement(rawText, failedFields, extracted);
      // Merge: use refined value if it passes a quick sanity check
      if (refined.title && typeof refined.title === "string" && refined.title.length > 10) {
        extracted.title = refined.title;
        validationNotes.push(`Refined title via targeted extraction`);
      }
      if (refined.authors) {
        const cleaned = normalizeAuthors(refined.authors);
        if (cleaned && cleaned.length > 2) {
          extracted.authors = cleaned;
          validationNotes.push(`Refined authors via targeted extraction`);
        }
      }
      if (refined.abstract && typeof refined.abstract === "string" && refined.abstract.split(/\s+/).length >= 30) {
        extracted.abstract = refined.abstract;
        validationNotes.push(`Refined abstract via targeted extraction`);
      }
    } catch (err) {
      validationNotes.push(`Retry extraction failed: ${err}`);
    }
  }

  // Build final result
  const title = typeof extracted.title === "string" && extracted.title.length > 5
    ? extracted.title.trim().replace(/\s+/g, " ")
    : undefined;

  const authors = normalizeAuthors(extracted.authors);

  const abstract =
    typeof extracted.abstract === "string" && extracted.abstract.length > 30
      ? extracted.abstract.trim().replace(/\s+/g, " ").slice(0, 3000)
      : undefined;

  const year = parseYear(extracted.year);

  const doi =
    typeof extracted.doi === "string" && extracted.doi.startsWith("10.")
      ? extracted.doi.trim()
      : undefined;

  const arxivId =
    typeof extracted.arxivId === "string" && /^\d{4}\.\d{4,5}(v\d+)?$/.test(extracted.arxivId.trim())
      ? extracted.arxivId.trim()
      : undefined;

  const keyFieldsFound = [title, authors, abstract].filter(Boolean).length;
  const confidence: "high" | "medium" | "low" =
    keyFieldsFound === 3 ? "high" : keyFieldsFound >= 2 ? "medium" : "low";

  return { title, authors, abstract, year, doi, arxivId, confidence, source, validationNotes };
}
