import { NextRequest, NextResponse } from "next/server";
import { requireActiveWorkspaceId, getCurrentUser } from "@/lib/auth";
import { requireWorkspacePermission, WorkspacePermission } from "@/lib/rbac";
import { logWorkspaceAuditEvent, AuditAction } from "@/lib/audit";
import { crawlArxiv } from "@/lib/crawler/arxivCrawler";
import { crawlSemanticScholar } from "@/lib/crawler/semanticScholarCrawler";

export async function POST(request: NextRequest) {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Check permission to trigger crawls
    await requireWorkspacePermission(
      user.id,
      workspaceId,
      WorkspacePermission.TRIGGER_CRAWL
    );
    
    const body = await request.json();
    
    const {
      source = "both", // "arxiv" | "semantic" | "both"
      conferences = ["NEURIPS", "ICML", "ICLR"],
      yearFrom = new Date().getFullYear() - 2,
      yearTo = new Date().getFullYear(),
      maxPapersPerConference = 50,
    } = body;
    
    const config = {
      conferences,
      yearRange: { from: yearFrom, to: yearTo },
      maxPapersPerConference,
      workspaceId,
    };
    
    let arxivResults = null;
    let semanticResults = null;
    
    // Run crawlers based on source
    if (source === "arxiv" || source === "both") {
      console.log("Starting arXiv crawl...");
      arxivResults = await crawlArxiv(config);
    }
    
    if (source === "semantic" || source === "both") {
      console.log("Starting Semantic Scholar crawl...");
      semanticResults = await crawlSemanticScholar(config);
    }
    
    // Log the crawl action
    await logWorkspaceAuditEvent(
      workspaceId,
      user.id,
      AuditAction.CRAWLER_TRIGGERED,
      {
        source,
        conferences: conferences.join(", "),
        yearFrom,
        yearTo,
        arxivImported: arxivResults?.imported || 0,
        semanticImported: semanticResults?.imported || 0,
        totalImported: (arxivResults?.imported || 0) + (semanticResults?.imported || 0),
      }
    );
    
    return NextResponse.json({
      success: true,
      arxiv: arxivResults,
      semanticScholar: semanticResults,
      totalImported: 
        (arxivResults?.imported || 0) + (semanticResults?.imported || 0),
      totalSkipped: 
        (arxivResults?.skipped || 0) + (semanticResults?.skipped || 0),
      totalErrors: 
        (arxivResults?.errors || 0) + (semanticResults?.errors || 0),
    });
    
  } catch (error) {
    console.error("Crawler API error:", error);
    const message = error instanceof Error ? error.message : "Crawler failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    const { db } = await import("@/lib/db");
    
    // Get crawler stats
    const recentPapers = await db.paper.count({
      where: {
        workspaceId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });
    
    const externalCached = await db.externalPaper.count();
    
    const byVenue = await db.paper.groupBy({
      by: ["venueType"],
      where: { workspaceId },
      _count: true,
    });
    
    return NextResponse.json({
      recentImports: recentPapers,
      cachedExternal: externalCached,
      byVenue: byVenue.map(v => ({
        venue: v.venueType,
        count: v._count,
      })),
    });
    
  } catch (error) {
    console.error("Crawler stats error:", error);
    const message = error instanceof Error ? error.message : "Failed to get stats";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
