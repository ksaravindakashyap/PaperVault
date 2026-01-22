/**
 * pdfjs-dist Node-safe extractor (no worker, bounded page extraction)
 * Uses resilient loader to work across pdfjs-dist versions
 */
import { createRequire } from "module";
import fs from "fs/promises";
import path from "path";
import { normalizeText } from "./pdfText";

const require = createRequire(import.meta.url);

/**
 * Try to require from multiple possible paths
 */
function tryRequire(paths: string[]) {
  for (const p of paths) {
    try {
      return require(p);
    } catch {
      // Path doesn't exist, try next
    }
  }
  return null;
}

/**
 * Load pdfjs-dist with resilient path resolution
 * Tries multiple known entrypoints across versions
 */
function loadPdfjs() {
  const pdfjs = tryRequire([
    "pdfjs-dist/legacy/build/pdf.cjs",
    "pdfjs-dist/legacy/build/pdf.js",
    "pdfjs-dist/build/pdf.cjs",
    "pdfjs-dist/build/pdf.js",
  ]);

  if (!pdfjs) {
    throw new Error(
      "pdfjs-dist not found at known entrypoints. Install/lock pdfjs-dist or update loader."
    );
  }

  // CRITICAL: force worker OFF in Node
  // Some builds require workerSrc to be set even if disableWorker is true.
  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = null;
  }

  return pdfjs;
}

export interface PdfjsExtractionResult {
  text: string;
  totalPages: number;
  pagesUsed: number[];
}

/**
 * Extract text from specific pages using pdfjs-dist (Node-safe, no worker)
 * @param fileKey - relative path to PDF (e.g., "data/uploads/xyz.pdf")
 * @param pageNumbers - array of 1-indexed page numbers to extract
 */
export async function extractTextFromPagesPdfjs(
  fileKey: string,
  pageNumbers: number[]
): Promise<PdfjsExtractionResult> {
  const pdfjs = loadPdfjs();
  
  const filePath = path.join(process.cwd(), fileKey);
  const buf = await fs.readFile(filePath);
  
  // CRITICAL: pdfjs requires Uint8Array
  const data = new Uint8Array(buf);

  const loadingTask = pdfjs.getDocument({
    data,
    disableWorker: true,
  });
  
  const doc = await loadingTask.promise;
  const totalPages = doc.numPages;

  // Filter and sort page numbers
  const pages = [...new Set(pageNumbers)]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  let out = "";
  for (const p of pages) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const strings = content.items.map((it: any) => it.str).filter(Boolean);
    out += `\n\n===PAGE ${p}===\n\n` + strings.join(" ");
  }

  // Clean up
  try {
    await doc.destroy?.();
  } catch {
    // Ignore cleanup errors
  }

  return {
    text: normalizeText(out),
    totalPages,
    pagesUsed: pages,
  };
}

/**
 * Get total page count quickly (without extracting text)
 */
export async function getTotalPagesPdfjs(fileKey: string): Promise<number> {
  const pdfjs = loadPdfjs();
  
  const filePath = path.join(process.cwd(), fileKey);
  const buf = await fs.readFile(filePath);
  
  // CRITICAL: pdfjs requires Uint8Array
  const data = new Uint8Array(buf);

  const loadingTask = pdfjs.getDocument({
    data,
    disableWorker: true,
  });
  
  const doc = await loadingTask.promise;
  const totalPages = doc.numPages;

  try {
    await doc.destroy?.();
  } catch {
    // Ignore cleanup errors
  }

  return totalPages;
}
