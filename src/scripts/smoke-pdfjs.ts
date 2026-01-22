/**
 * Smoke test for pdfjs-dist Node fallback
 * Validates that pdfjs can extract text without worker setup errors
 */
import { extractTextFromPagesPdfjs } from "../lib/extraction/pdfjsNode";
import fs from "fs/promises";
import path from "path";

async function findTestPdf(): Promise<string | null> {
  // Check data/uploads first
  const uploadsDir = path.join(process.cwd(), "data/uploads");
  try {
    const uploadFiles = await fs.readdir(uploadsDir);
    const pdfFile = uploadFiles.find((f) => f.endsWith(".pdf"));
    if (pdfFile) {
      return path.join("data/uploads", pdfFile);
    }
  } catch {
    // Directory might not exist
  }

  // Check test-pdfs directory
  const testPdfsDir = path.join(process.cwd(), "test-pdfs");
  try {
    const testFiles = await fs.readdir(testPdfsDir);
    const pdfFile = testFiles.find((f) => f.endsWith(".pdf"));
    if (pdfFile) {
      return path.join("test-pdfs", pdfFile);
    }
  } catch {
    // Directory might not exist
  }

  return null;
}

async function main() {
  console.log("🔍 PaperVault pdfjs-dist Smoke Test");
  console.log("=" .repeat(50));

  // Allow override via environment variable
  let testPdfPath: string | null | undefined = process.env.TEST_PDF;

  if (!testPdfPath) {
    console.log("No TEST_PDF env var, searching for test PDF...");
    testPdfPath = await findTestPdf();
  }

  if (!testPdfPath) {
    console.error("❌ FAIL: No test PDF found");
    console.error("   Place a PDF in data/uploads/ or test-pdfs/");
    console.error("   Or set TEST_PDF=path/to/file.pdf");
    process.exit(1);
  }

  console.log(`📄 Testing with: ${testPdfPath}`);

  try {
    // Extract first page
    const result = await extractTextFromPagesPdfjs(testPdfPath, [1]);

    console.log(`✅ Extraction succeeded!`);
    console.log(`   Total pages: ${result.totalPages}`);
    console.log(`   Pages extracted: ${result.pagesUsed.join(", ")}`);
    console.log(`   Text length: ${result.text.length} chars`);
    console.log();
    console.log("📝 First 200 chars:");
    console.log("-".repeat(50));
    console.log(result.text.substring(0, 200));
    console.log("-".repeat(50));
    console.log();
    console.log("✨ PASS - pdfjs-dist Node fallback is working!");
    process.exit(0);
  } catch (error) {
    console.error("❌ FAIL - pdfjs extraction error:");
    console.error(error);
    process.exit(1);
  }
}

main();
