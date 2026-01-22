import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readPdf, fileExists } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Look up paper by ID
    const paper = await db.paper.findUnique({
      where: { id },
      select: {
        fileKey: true,
        originalFileName: true,
      },
    });

    if (!paper) {
      return NextResponse.json(
        { message: "Paper not found" },
        { status: 404 }
      );
    }

    // Check if file exists
    const exists = await fileExists(paper.fileKey);
    if (!exists) {
      return NextResponse.json(
        { message: "File not found" },
        { status: 404 }
      );
    }

    // Read and serve file
    const buffer = await readPdf(paper.fileKey);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${paper.originalFileName}"`,
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { message: "Failed to download file" },
      { status: 500 }
    );
  }
}
