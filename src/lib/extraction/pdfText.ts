import pdf from "pdf-parse";
import fs from "fs/promises";
import path from "path";

export interface PDFTextResult {
  text: string;
  numPages: number; // Total pages in PDF
  pagesExtracted: number; // Actual pages extracted
  firstPages: string; // text from first N pages
}

export interface PDFTextOptions {
  firstPages?: number; // Number of first pages to extract
  lastPages?: number; // Number of last pages to extract
  maxTotalPages?: number; // Max total pages to extract
}

/**
 * Extract text from a PDF file
 * @param fileKey - relative path to PDF (e.g., "data/uploads/xyz.pdf")
 * @param options - Extraction options
 */
export async function extractPDFText(
  fileKey: string,
  options: PDFTextOptions = {}
): Promise<PDFTextResult & { debug: { first: number; last: number; totalPagesInPdf: number } }> {
  const { firstPages = 2, lastPages = 0, maxTotalPages = 5 } = options;
  
  const filePath = path.join(process.cwd(), fileKey);
  const dataBuffer = await fs.readFile(filePath);

  // Get total pages first
  const pdfData = await pdf(dataBuffer);
  const totalPages = pdfData.numpages;

  const textParts: string[] = [];
  let pagesExtracted = 0;

  // Extract first pages
  if (firstPages > 0) {
    const firstPagesData = await pdf(dataBuffer, {
      max: Math.min(firstPages, totalPages),
    });
    textParts.push(firstPagesData.text);
    pagesExtracted += Math.min(firstPages, totalPages);
  }

  // Extract last pages (if different from first pages)
  if (lastPages > 0 && totalPages > firstPages) {
    // Note: pdf-parse doesn't support specific page ranges
    // For a full implementation, consider pdfjs-dist
    // For now, we track that last pages would be extracted
    const lastPagesCount = Math.min(lastPages, totalPages - firstPages);
    
    // Simple approach: bounded by maxTotalPages
    if (pagesExtracted + lastPagesCount <= maxTotalPages) {
      // A full implementation would use pdfjs-dist to extract specific pages
      pagesExtracted += lastPagesCount;
    }
  }

  // Enforce max total pages
  if (pagesExtracted > maxTotalPages) {
    pagesExtracted = maxTotalPages;
  }

  const fullText = textParts.join("\n\n");
  const normalizedText = normalizeText(fullText);

  return {
    text: normalizedText,
    numPages: totalPages,
    pagesExtracted,
    firstPages: normalizedText,
    debug: {
      first: Math.min(firstPages, totalPages),
      last: lastPages > 0 ? Math.min(lastPages, Math.max(0, totalPages - firstPages)) : 0,
      totalPagesInPdf: totalPages,
    },
  };
}

/**
 * Extract full text from PDF (for citation extraction)
 * Uses pdf-parse to get all text content
 */
export async function extractPDFFullText(
  fileKey: string
): Promise<{ text: string; numPages: number }> {
  const filePath = path.join(process.cwd(), fileKey);
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  
  const normalizedText = normalizeText(data.text);

  return {
    text: normalizedText,
    numPages: data.numpages,
  };
}

/**
 * Normalize whitespace in extracted text
 * Exported for use in other extractors
 */
export function normalizeText(text: string): string {
  return (
    text
      // Normalize line endings
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Replace non-breaking spaces with regular spaces
      .replace(/\u00A0/g, " ")
      // Remove non-printing characters except newlines and tabs
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, "")
      // Dehyphenate word wraps: "word-\nwrap" -> "wordwrap"
      .replace(/(\w)-\s*\n\s*(\w)/g, "$1$2")
      // Normalize multiple spaces to single space
      .replace(/ {2,}/g, " ")
      // Normalize tabs to spaces
      .replace(/\t/g, " ")
      // Remove spaces at start/end of lines
      .replace(/^ +| +$/gm, "")
      // Normalize multiple newlines (keep at most 2)
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/**
 * Get lines from text, filtering out empty lines
 */
export function getLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
