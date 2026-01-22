import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateSummarySchema } from "@/lib/validators";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Validate input
    const validation = updateSummarySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if paper exists
    const paper = await db.paper.findUnique({
      where: { id },
    });

    if (!paper) {
      return NextResponse.json(
        { message: "Paper not found" },
        { status: 404 }
      );
    }

    // Update summary
    const updatedPaper = await db.paper.update({
      where: { id },
      data: {
        summary: validation.data.summary,
      },
    });

    return NextResponse.json({ ok: true, summary: updatedPaper.summary });
  } catch (error) {
    console.error("Summary update error:", error);
    return NextResponse.json(
      { message: "Failed to update summary" },
      { status: 500 }
    );
  }
}
