import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.NVIDIA_NIM_API_KEY,
  baseURL: process.env.NVIDIA_NIM_BASE_URL,
});

const MODEL = process.env.LLM_MODEL || "stepfun-ai/step-3.5-flash";

export interface QueryDecomposition {
  intent: string;
  keywords: string[];
  venues: string[];
  yearRange: { from?: number; to?: number };
  topics: string[];
  fieldsOfStudy: string[];
}

const KNOWN_VENUES = [
  "ACL", "EMNLP", "NAACL", "NeurIPS", "ICML", "ICLR",
  "USENIX Security", "CCS", "NDSS", "CHI", "CVPR", "ICCV", "ECCV",
  "SIGCOMM", "OSDI", "SOSP", "IEEE S&P",
];

export async function decomposeQuery(query: string): Promise<QueryDecomposition> {
  const currentYear = new Date().getFullYear();

  const prompt = `You are a research query analyzer for a scientific paper search system.

Decompose the following research query into structured parameters for searching academic papers.

Query: "${query}"

Return ONLY a JSON object with these exact keys:
{
  "intent": "one clear sentence describing what the researcher wants to find",
  "keywords": ["3 to 7 specific search terms relevant to the topic"],
  "venues": ["relevant conferences from this list only: ACL, EMNLP, NAACL, NeurIPS, ICML, ICLR, USENIX Security, CCS, NDSS, CHI, CVPR, SIGCOMM, IEEE S&P"],
  "yearRange": { "from": <start year as integer>, "to": <end year as integer> },
  "topics": ["3 to 5 specific research sub-topics"],
  "fieldsOfStudy": ["primary academic field"]
}

Important rules:
- If the query mentions a specific year or era, use that as the yearRange. Otherwise use ${currentYear - 5} to ${currentYear}.
- If the query is about a classic/foundational paper (e.g. transformers, BERT, ResNet), set yearRange from to the decade it was published.
- venues must only contain names from the list above, or leave empty if unclear.
- Return ONLY the JSON, no explanation, no markdown.`;

  let rawContent: string | null = null;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a precise research query analyzer. Output only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 32768,
    });

    const choice = response.choices[0];
    // Step 3.5 Flash is a reasoning model — the final JSON may land in
    // `content` OR `reasoning_content` depending on how the model responds.
    const msg = choice.message as {
      content?: string | null;
      reasoning_content?: string | null;
    };
    rawContent = (msg.content || msg.reasoning_content) ?? null;
  } catch (err) {
    throw new Error(`LLM API call failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!rawContent?.trim()) {
    throw new Error("LLM returned empty response");
  }

  const parsed = extractJSON(rawContent);
  if (!parsed) {
    throw new Error(`Could not parse JSON from LLM response: ${rawContent.slice(0, 300)}`);
  }

  return normalizeDecomposition(parsed, currentYear);
}

function extractJSON(text: string): Record<string, unknown> | null {
  // Direct parse
  try { return JSON.parse(text.trim()); } catch {}

  // Strip markdown code fences
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    try { return JSON.parse(fence[1].trim()); } catch {}
  }

  // Try every { ... } window from last to first (model may have reasoning preamble)
  const end = text.lastIndexOf("}");
  if (end === -1) return null;
  let start = end;
  while (start >= 0) {
    start = text.lastIndexOf("{", start);
    if (start === -1) break;
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
    start--;
  }

  return null;
}

export interface GapPaper {
  title: string;
  authors?: string | null;
  year?: number | null;
  abstract?: string | null;
  venue?: string | null;
}

export interface ResearchGap {
  title: string;
  description: string;
  paperIndices: number[];
}

export async function findResearchGaps(
  focus: string,
  libraryPapers: GapPaper[],
  externalPapers: GapPaper[]
): Promise<ResearchGap[]> {
  const formatList = (papers: GapPaper[], start = 0) =>
    papers
      .map((p, i) => {
        const idx = start + i;
        const abstract = p.abstract ? p.abstract.slice(0, 300) : "No abstract";
        return `[${idx}] ${p.title} (${p.year ?? "??"}) — ${abstract}`;
      })
      .join("\n");

  const libraryBlock = libraryPapers.length > 0
    ? formatList(libraryPapers, 0)
    : "No relevant papers found in library.";

  const externalBlock = externalPapers.length > 0
    ? formatList(externalPapers, libraryPapers.length)
    : "No external papers found.";

  const prompt = `Research focus: "${focus}"

Library papers (already read):
${libraryBlock}

External papers NOT in library:
${externalBlock}

Identify 3 research gaps the researcher is missing. Output ONLY this JSON, no other text:
{"gaps":[{"title":"...","description":"2-3 sentences","paperIndices":[N,...]},...]}`;

  let rawContent: string | null = null;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You output ONLY valid JSON. No explanation, no reasoning text, no markdown. Just the JSON object." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      top_p: 0.9,
      max_tokens: 32768,
    });

    const msg = response.choices[0].message as { content?: string | null; reasoning_content?: string | null };
    rawContent = (msg.content || msg.reasoning_content) ?? null;
  } catch (err) {
    throw new Error(`LLM API call failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!rawContent?.trim()) throw new Error("LLM returned empty response");

  const parsed = extractJSON(rawContent);
  if (!parsed || !Array.isArray((parsed as Record<string, unknown>).gaps)) {
    throw new Error(`Could not parse gaps from LLM response: ${rawContent.slice(0, 300)}`);
  }

  const raw = parsed as { gaps: Array<{ title?: unknown; description?: unknown; paperIndices?: unknown }> };
  return raw.gaps
    .filter((g) => typeof g.title === "string" && typeof g.description === "string")
    .map((g) => ({
      title: g.title as string,
      description: g.description as string,
      paperIndices: Array.isArray(g.paperIndices)
        ? (g.paperIndices as unknown[]).filter((i): i is number => typeof i === "number")
        : [],
    }))
    .slice(0, 4);
}

export interface SynthesisPaper {
  title: string;
  authors?: string | null;
  year?: number | null;
  abstract?: string | null;
}

export async function synthesizePapers(papers: SynthesisPaper[]): Promise<string> {
  const paperBlocks = papers
    .map((p, i) => {
      let authors = p.authors ?? null;
      if (authors) {
        try {
          const arr = JSON.parse(authors);
          if (Array.isArray(arr)) authors = arr.map((a: { name?: string }) => a.name ?? "").filter(Boolean).join(", ");
        } catch { /* plain string */ }
      }
      const lines = [`[Paper ${i + 1}] ${p.title}`];
      if (authors) lines.push(`Authors: ${authors}`);
      if (p.year) lines.push(`Year: ${p.year}`);
      if (p.abstract) lines.push(`Abstract: ${p.abstract.slice(0, 800)}`);
      return lines.join("\n");
    })
    .join("\n\n");

  const prompt = `You are a research assistant helping write academic literature reviews.

Given the following papers, write a concise synthesis (180–250 words) that:
1. Identifies key agreements and shared findings
2. Notes any contradictions or conflicting results
3. Highlights major methodological differences
4. Captures the overall state of knowledge in this area

${paperBlocks}

Write flowing academic prose, ready to paste into a literature review.
Return ONLY the synthesis, no preamble, no headers, no bullet points.`;

  let rawContent: string | null = null;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You write concise, precise academic literature synthesis. Output only the synthesis paragraph." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      top_p: 0.9,
      max_tokens: 32768,
    });

    const choice = response.choices[0];
    const msg = choice.message as { content?: string | null; reasoning_content?: string | null };
    rawContent = (msg.content || msg.reasoning_content) ?? null;
  } catch (err) {
    throw new Error(`LLM API call failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!rawContent?.trim()) throw new Error("LLM returned empty response");

  // Strip any markdown code fences if present
  const fenced = rawContent.match(/```[\s\S]*?```/);
  return fenced ? rawContent.replace(/```[\s\S]*?```/g, "").trim() : rawContent.trim();
}

function normalizeDecomposition(raw: Record<string, unknown>, currentYear: number): QueryDecomposition {
  const intent =
    typeof raw.intent === "string" && raw.intent.length > 0
      ? raw.intent
      : "Find relevant research papers";

  const keywords = Array.isArray(raw.keywords)
    ? (raw.keywords as unknown[]).filter((k): k is string => typeof k === "string").slice(0, 7)
    : [];

  const venues = Array.isArray(raw.venues)
    ? (raw.venues as unknown[]).filter((v): v is string => typeof v === "string")
    : [];

  const yr = raw.yearRange as Record<string, unknown> | undefined;
  const yearRange = {
    from: typeof yr?.from === "number" ? yr.from : currentYear - 5,
    to: typeof yr?.to === "number" ? yr.to : currentYear,
  };

  const topics = Array.isArray(raw.topics)
    ? (raw.topics as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 5)
    : [];

  const fieldsOfStudy = Array.isArray(raw.fieldsOfStudy)
    ? (raw.fieldsOfStudy as unknown[]).filter((f): f is string => typeof f === "string")
    : ["Computer Science"];

  return { intent, keywords, venues, yearRange, topics, fieldsOfStudy };
}
