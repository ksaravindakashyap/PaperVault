import { db } from "../lib/db";
import { extractMetadata } from "../lib/extraction/extract";
import { generateBibTeX } from "../lib/citations/bibtex";
import { extractCitationsFromPDF } from "../lib/extraction/citations";
import { resolveCitationTargets } from "../lib/extraction/citationResolver";
import os from "os";

const WORKER_ID = `${os.hostname()}-${Math.random().toString(36).substring(7)}`;
const POLL_INTERVAL_MS = 5000; // 5 seconds
const LOCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

async function claimNextJob() {
  const now = new Date();
  const staleThreshold = new Date(now.getTime() - LOCK_TIMEOUT_MS);

  // Find a paper that needs processing
  const paper = await db.paper.findFirst({
    where: {
      status: "PROCESSING",
      processingAttempts: { lt: MAX_ATTEMPTS },
      OR: [
        { processingLockedAt: null },
        { processingLockedAt: { lt: staleThreshold } },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!paper) {
    return null;
  }

  // Claim the job by setting lock
  const claimed = await db.paper.updateMany({
    where: {
      id: paper.id,
      // Double-check it's still unclaimed (race condition protection)
      OR: [
        { processingLockedAt: null },
        { processingLockedAt: { lt: staleThreshold } },
      ],
    },
    data: {
      processingLockedAt: now,
      processingLockedBy: WORKER_ID,
      processingAttempts: { increment: 1 },
    },
  });

  if (claimed.count === 0) {
    // Someone else claimed it
    return null;
  }

  // Refetch to get updated data
  return await db.paper.findUnique({ where: { id: paper.id } });
}

async function processPaper(paperId: string) {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Processing paper ${paperId}...`);

  try {
    const paper = await db.paper.findUnique({ where: { id: paperId } });
    if (!paper) {
      throw new Error("Paper not found");
    }

    console.log(
      `  Venue: ${paper.venueType}, Attempt: ${paper.processingAttempts}`
    );

    // Extract metadata
    const metadata = await extractMetadata(paper.fileKey, paper.venueType);

    console.log(`  Extracted metadata:
    - Title: ${metadata.title?.substring(0, 50) || "N/A"}...
    - Authors: ${metadata.authors?.substring(0, 50) || "N/A"}...
    - Year: ${metadata.year || "N/A"}
    - DOI: ${metadata.doi || "N/A"}
    - arXiv: ${metadata.arxivId || "N/A"}
    - Abstract: ${metadata.abstract ? `${metadata.abstract.length} chars` : "N/A"}
    - Detected Venue: ${metadata.venueDetection.detected || "none"} (${Math.round(metadata.venueDetection.confidence * 100)}%)
    - Signals: ${metadata.debug.signals.join("; ")}`);

    if (metadata.venueDetection.mismatchNote) {
      console.log(`  ⚠️  Venue Mismatch: ${metadata.venueDetection.mismatchNote}`);
    }

    // Generate BibTeX
    const bibtex = generateBibTeX({
      paperId: paper.id,
      title: metadata.title,
      authors: metadata.authors,
      year: metadata.year,
      venueType: paper.venueType,
      doi: metadata.doi,
      arxivId: metadata.arxivId,
    });

    // Update paper with extracted data
    await db.paper.update({
      where: { id: paperId },
      data: {
        title: metadata.title,
        authors: metadata.authors,
        year: metadata.year,
        doi: metadata.doi,
        arxivId: metadata.arxivId,
        abstract: metadata.abstract,
        bibtex: bibtex,
        detectedVenueType: metadata.venueDetection.detected,
        venueMismatchNote: metadata.venueDetection.mismatchNote,
        status: "READY",
        processedAt: new Date(),
        lastProcessingError: null,
        processingLockedAt: null,
        processingLockedBy: null,
      },
    });

    const duration = Date.now() - startTime;
    console.log(
      `[${new Date().toISOString()}] ✓ Paper ${paperId} processed successfully in ${duration}ms\n`
    );

    // Extract citations (non-blocking)
    try {
      await extractAndStoreCitations(paperId, paper.fileKey);
    } catch (citError) {
      console.error(`Citation extraction failed for ${paperId}:`, citError);
      await db.paper.update({
        where: { id: paperId },
        data: {
          citationsStatus: "FAILED",
          citationsError: citError instanceof Error ? citError.message : String(citError),
        },
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[${new Date().toISOString()}] ✗ Paper ${paperId} failed after ${duration}ms: ${errorMessage}\n`
    );

    // Get current attempts
    const paper = await db.paper.findUnique({
      where: { id: paperId },
      select: { processingAttempts: true },
    });

    const attempts = paper?.processingAttempts || 0;

    // Update with error, mark as FAILED if max attempts reached
    await db.paper.update({
      where: { id: paperId },
      data: {
        lastProcessingError: errorMessage.substring(0, 500),
        status: attempts >= MAX_ATTEMPTS ? "FAILED" : "PROCESSING",
        processingLockedAt: null,
        processingLockedBy: null,
      },
    });
  }
}

async function workerLoop() {
  console.log(`[${new Date().toISOString()}] Worker started: ${WORKER_ID}`);
  console.log(
    `  Poll interval: ${POLL_INTERVAL_MS}ms, Lock timeout: ${LOCK_TIMEOUT_MS}ms, Max attempts: ${MAX_ATTEMPTS}\n`
  );

  while (true) {
    try {
      const paper = await claimNextJob();

      if (paper) {
        await processPaper(paper.id);
      } else {
        // No work available, wait before next poll
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Worker loop error:`,
        error
      );
      // Wait a bit before retrying to avoid tight error loop
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log(`\n[${new Date().toISOString()}] Worker shutting down...`);
  
  // Release any locks held by this worker
  try {
    await db.paper.updateMany({
      where: { processingLockedBy: WORKER_ID },
      data: {
        processingLockedAt: null,
        processingLockedBy: null,
      },
    });
    console.log("Released all locks");
  } catch (error) {
    console.error("Error releasing locks:", error);
  }
  
  process.exit(0);
});

/**
 * Extract and store citations for a paper using pdf-parse
 */
async function extractAndStoreCitations(
  paperId: string,
  fileKey: string
): Promise<void> {
  console.log(`Extracting citations for paper ${paperId}...`);

  // Extract citations using pdf-parse (full text search)
  const result = await extractCitationsFromPDF(fileKey, {
    minCitations: 10,
    maxCitations: 200,
  });

  console.log(`  Found ${result.citations.length} citations`);
  console.log(`  Engine: ${result.debug.engine || "pdf-parse"}`);
  console.log(`  Total pages in PDF: ${result.debug.numPages}`);
  console.log(`  Found References header: ${result.debug.foundHeader}`);
  if (result.debug.pagesScanned) {
    console.log(`  Pages scanned (pdfjs): ${result.debug.pagesScanned.join(", ")}`);
  }
  console.log(`  Signals: ${result.debug.signals.join("; ")}`);


  if (result.citations.length === 0) {
    await db.paper.update({
      where: { id: paperId },
      data: {
        citationsStatus: "DONE",
        citationsExtractedAt: new Date(),
        citationsCount: 0,
      },
    });
    return;
  }

  // Resolve internal links
  const resolved = await resolveCitationTargets(result.citations);
  
  const linkedCount = resolved.filter((c) => c.targetPaperId).length;
  console.log(`  Linked ${linkedCount} citations to internal papers`);

  // Delete existing citations
  await db.citation.deleteMany({
    where: { sourcePaperId: paperId },
  });

  // Insert new citations
  await db.citation.createMany({
    data: resolved.map((c) => ({
      sourcePaperId: paperId,
      raw: c.raw,
      title: c.title,
      authors: c.authors,
      year: c.year,
      venue: c.venue,
      doi: c.doi,
      arxivId: c.arxivId,
      url: c.url,
      targetPaperId: c.targetPaperId,
    })),
  });

  // Update paper status
  await db.paper.update({
    where: { id: paperId },
    data: {
      citationsStatus: "DONE",
      citationsExtractedAt: new Date(),
      citationsCount: resolved.length,
      citationsScannedPages: `${result.debug.numPages} pages`,
      citationsError: null,
    },
  });

  console.log(`✓ Citations extracted for ${paperId}`);
}

// Start the worker
workerLoop().catch((error) => {
  console.error("Fatal worker error:", error);
  process.exit(1);
});
