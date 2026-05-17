import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireActiveWorkspaceId } from "@/lib/auth";
import { VenueType } from "@prisma/client";

function mapVenueToType(venue: string | null): VenueType {
  if (!venue) return VenueType.OTHER;
  const v = venue.toUpperCase();
  if (v.includes("NEURIPS") || v.includes("NIPS")) return VenueType.NEURIPS;
  if (v.includes("ICML")) return VenueType.ICML;
  if (v.includes("ICLR")) return VenueType.ICLR;
  if (v.includes("EMNLP")) return VenueType.EMNLP;
  if (v.includes("NAACL")) return VenueType.NAACL;
  if (v.includes("ACL")) return VenueType.ACL;
  if (v.includes("USENIX") || v.includes("SECURITY SYMPOSIUM")) return VenueType.USENIX_SECURITY;
  if (v.includes("CCS")) return VenueType.CCS;
  if (v.includes("NDSS")) return VenueType.NDSS;
  if (v.includes("CHI")) return VenueType.CHI;
  if (v.includes("IEEE")) return VenueType.IEEE_GENERIC;
  return VenueType.OTHER;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const workspaceId = await requireActiveWorkspaceId();
    const { externalPaperId } = await request.json();

    if (!externalPaperId) {
      return NextResponse.json({ error: "externalPaperId required" }, { status: 400 });
    }

    const external = await db.externalPaper.findUnique({
      where: { id: externalPaperId },
    });

    if (!external) {
      return NextResponse.json({ error: "External paper not found" }, { status: 404 });
    }

    // Dedup: check if this paper is already in the workspace by arxivId or doi
    const existing = await db.paper.findFirst({
      where: {
        workspaceId,
        OR: [
          external.arxivId ? { arxivId: external.arxivId } : undefined,
          external.doi ? { doi: external.doi } : undefined,
        ].filter(Boolean) as object[],
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ paperId: existing.id, alreadyExists: true });
    }

    // Use a synthetic fileKey so Paper can be stored without an actual upload.
    // The library UI and paper detail page skip the PDF viewer for these.
    const fileKey = `external:${external.semanticScholarId ?? external.id}`;
    const venueType = mapVenueToType(external.venue);

    const paper = await db.paper.create({
      data: {
        workspaceId,
        fileKey,
        originalFileName: external.title.slice(0, 255),
        venueType,
        status: "READY",
        title: external.title,
        authors: external.authors,
        abstract: external.abstract ?? null,
        year: external.year ?? null,
        doi: external.doi ?? null,
        arxivId: external.arxivId ?? null,
      },
      select: { id: true, title: true },
    });

    // Copy embedding from ExternalPaper if it already has one (avoids a separate API call)
    if (external.embeddingStatus === "DONE") {
      await db.$executeRaw`
        UPDATE "Paper" p
        SET embedding = e.embedding,
            "embeddingStatus" = 'DONE',
            "embeddedAt" = NOW()
        FROM "ExternalPaper" e
        WHERE p.id = ${paper.id}
          AND e.id = ${external.id}
          AND e.embedding IS NOT NULL
      `;
    } else {
      await db.paper.update({ where: { id: paper.id }, data: { embeddingStatus: "PENDING" } });
    }

    return NextResponse.json({ paperId: paper.id, alreadyExists: false });
  } catch (error) {
    console.error("Library import failed:", error);
    return NextResponse.json(
      { error: "Failed to import paper" },
      { status: 500 }
    );
  }
}
