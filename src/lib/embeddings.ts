import OpenAI from "openai";

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.NVIDIA_NIM_API_KEY,
      baseURL: process.env.NVIDIA_NIM_BASE_URL,
    });
  }
  return _client;
}

const MODEL = process.env.EMBEDDING_MODEL || "nvidia/nv-embedqa-e5-v5";

// nv-embedqa-e5-v5 is asymmetric: passages go in the index, queries go at search time
export async function generateEmbedding(
  text: string,
  inputType: "passage" | "query" = "passage"
): Promise<number[]> {
  const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 8000);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (getClient().embeddings.create as any)({
    model: MODEL,
    input: cleaned,
    encoding_format: "float",
    input_type: inputType,
    truncate: "END",
  });
  return response.data[0].embedding;
}

export function paperTextForEmbedding(paper: {
  title?: string | null;
  abstract?: string | null;
  authors?: string | null;
  venue?: string | null;
  year?: number | null;
}): string {
  const parts = [
    paper.title,
    paper.abstract,
    paper.authors ? `Authors: ${paper.authors}` : null,
    paper.venue ? `Venue: ${paper.venue}` : null,
    paper.year ? `Year: ${paper.year}` : null,
  ].filter(Boolean);
  return parts.join("\n\n");
}

export async function embedPaper(paper: {
  title?: string | null;
  abstract?: string | null;
  authors?: string | null;
  venue?: string | null;
  year?: number | null;
}): Promise<number[]> {
  const text = paperTextForEmbedding(paper);
  if (!text.trim()) throw new Error("No text to embed");
  return generateEmbedding(text, "passage");
}
