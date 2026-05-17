import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractMetadata } from "@/lib/extraction/extract";
import { generateBibTeX } from "@/lib/citations/bibtex";
import { embedPaper } from "@/lib/embeddings";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "1";
    const useDetected = searchParams.get("useDetected") === "1";

    // Look up paper
    const paper = await db.paper.findUnique({
      where: { id },
    });

    if (!paper) {
      return NextResponse.json(
        { message: "Paper not found" },
        { status: 404 }
      );
    }

    // Check if already processed
    if (paper.status === "READY" && !force) {
      return NextResponse.json(
        {
          message: "Paper already processed. Use ?force=1 to reprocess.",
          status: paper.status,
        },
        { status: 409 }
      );
    }

    // Check if locked by worker
    if (
      paper.processingLockedAt &&
      new Date().getTime() - paper.processingLockedAt.getTime() <
        10 * 60 * 1000
    ) {
      return NextResponse.json(
        {
          message: "Paper is currently being processed by worker",
          lockedBy: paper.processingLockedBy,
        },
        { status: 423 }
      );
    }

    console.log(`On-demand processing for paper ${id}`);

    // Mark as processing
    await db.paper.update({
      where: { id },
      data: {
        processingLockedAt: new Date(),
        processingLockedBy: "api-on-demand",
        processingAttempts: { increment: 1 },
      },
    });

    try {
      // Determine which venue to use for extraction
      let venueForExtraction = paper.venueType;
      if (useDetected && paper.detectedVenueType) {
        venueForExtraction = paper.detectedVenueType;
        console.log(
          `Using detected venue ${venueForExtraction} instead of selected ${paper.venueType}`
        );
      }

      // Extract metadata
      const metadata = await extractMetadata(
        paper.fileKey,
        paper.venueType,
        useDetected
      );

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

      // Update paper
      const updatedPaper = await db.paper.update({
        where: { id },
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

      // Generate embedding in background (non-blocking)
      let embeddingGenerated = false;
      try {
        const vec = await embedPaper(updatedPaper);
        const vecLiteral = `[${vec.join(",")}]`;
        await db.$executeRaw`
          UPDATE "Paper"
          SET embedding = ${vecLiteral}::vector,
              "embeddingStatus" = 'DONE',
              "embeddedAt" = NOW()
          WHERE id = ${id}
        `;
        embeddingGenerated = true;
      } catch {
        await db.paper.update({
          where: { id },
          data: { embeddingStatus: "FAILED" },
        });
      }

      return NextResponse.json({
        success: true,
        status: updatedPaper.status,
        embeddingGenerated,
        metadata: {
          title: metadata.title,
          authors: metadata.authors,
          year: metadata.year,
          doi: metadata.doi,
          arxivId: metadata.arxivId,
          hasAbstract: !!metadata.abstract,
        },
        venueDetection: metadata.venueDetection,
        debug: metadata.debug,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Get current attempts
      const currentPaper = await db.paper.findUnique({
        where: { id },
        select: { processingAttempts: true },
      });

      const attempts = currentPaper?.processingAttempts || 0;

      // Update with error
      await db.paper.update({
        where: { id },
        data: {
          lastProcessingError: errorMessage.substring(0, 500),
          status: attempts >= 5 ? "FAILED" : "PROCESSING",
          processingLockedAt: null,
          processingLockedBy: null,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Processing failed",
          error: errorMessage,
          attempts,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Process route error:", error);
    return NextResponse.json(
      { message: "Failed to process paper" },
      { status: 500 }
    );
  }
}
