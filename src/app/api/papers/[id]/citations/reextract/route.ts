import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireActiveWorkspaceId, setUserIdCookie } from "@/lib/auth";
import { extractCitationsFromPDF } from "@/lib/extraction/citations";
import { resolveCitationTargets } from "@/lib/extraction/citationResolver";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Get or create local user
    let user = await getCurrentUser();
    if (!user) {
      user = await db.user.create({
        data: {
          name: "Local User",
        },
      });
      await setUserIdCookie(user.id);
    }

    const { id } = await context.params;
    const workspaceId = await requireActiveWorkspaceId();

    // Look up paper
    const paper = await db.paper.findUnique({
      where: { 
        id,
        workspaceId: workspaceId,
      },
      select: { workspaceId: true, fileKey: true },
    });

    if (!paper || !paper.workspaceId) {
      return NextResponse.json(
        { error: "Paper not found or not in active workspace" },
        { status: 404 }
      );
    }

    // Extract citations using pdf-parse
    console.log(`Extracting citations for paper ${id}...`);
    const result = await extractCitationsFromPDF(paper.fileKey, {
      minCitations: 10,
      maxCitations: 200,
    });

    console.log(`Found ${result.citations.length} citations`);
    console.log(`Engine: ${result.debug.engine || "pdf-parse"}`);
    if (result.debug.pagesScanned) {
      console.log(`Pages scanned (pdfjs): ${result.debug.pagesScanned.join(", ")}`);
    }
    console.log(`Signals: ${result.debug.signals.join("; ")}`);

    if (result.citations.length === 0) {
      await db.paper.update({
        where: { id },
        data: {
          citationsStatus: "DONE",
          citationsExtractedAt: new Date(),
          citationsCount: 0,
          citationsError: null,
        },
      });

      return NextResponse.json({
        success: true,
        status: "DONE",
        count: 0,
        message: "No citations found in this paper",
      });
    }

    // Resolve internal links
    const resolved = await resolveCitationTargets(result.citations);
    const linkedCount = resolved.filter((c) => c.targetPaperId).length;
    console.log(`Linked ${linkedCount} citations to internal papers`);

    // Delete existing citations
    await db.citation.deleteMany({
      where: { sourcePaperId: id },
    });

    // Insert new citations
    await db.citation.createMany({
      data: resolved.map((c) => ({
        workspaceId: paper.workspaceId!,
        sourcePaperId: id,
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
      where: { id },
      data: {
        citationsStatus: "DONE",
        citationsExtractedAt: new Date(),
        citationsCount: resolved.length,
        citationsScannedPages: `${result.debug.numPages} pages`,
        citationsError: null,
      },
    });

    return NextResponse.json({
      success: true,
      status: "DONE",
      count: resolved.length,
      linkedCount,
      debug: result.debug,
    });
  } catch (error) {
    console.error("Citation extraction error:", error);

    // Update paper with error
    const { id } = await context.params;
    await db.paper.update({
      where: { id },
      data: {
        citationsStatus: "FAILED",
        citationsError: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
