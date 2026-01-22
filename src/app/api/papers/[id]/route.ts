import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updatePaperStatusSchema } from "@/lib/validators";
import fs from "fs/promises";
import path from "path";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/papers/[id]
 * Update paper status
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Paper ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const validated = updatePaperStatusSchema.parse(body);

    const paper = await db.paper.update({
      where: { id },
      data: { status: validated.status },
    });

    return NextResponse.json(paper);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: error }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }
    console.error("Error updating paper:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update paper" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/papers/[id]
 * Delete a paper, its citations, and its PDF file
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Paper ID is required" }, { status: 400 });
    }

    // Find paper
    const paper = await db.paper.findUnique({
      where: { id },
      select: { id: true, fileKey: true },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Delete PDF file from disk
    if (paper.fileKey) {
      const filePath = path.join(process.cwd(), paper.fileKey);
      try {
        await fs.unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
      } catch (fileError) {
        // Ignore file-not-found errors
        if ((fileError as NodeJS.ErrnoException).code !== "ENOENT") {
          console.error(`Error deleting file ${filePath}:`, fileError);
        }
      }
    }

    // Delete citations first (if not cascade)
    await db.citation.deleteMany({
      where: { sourcePaperId: id },
    });

    // Delete paper record
    await db.paper.delete({
      where: { id },
    });

    console.log(`Paper ${id} deleted successfully`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting paper:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete paper" },
      { status: 500 }
    );
  }
}
