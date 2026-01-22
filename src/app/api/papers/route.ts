import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireActiveWorkspaceId } from "@/lib/auth";

export async function GET() {
  try {
    const workspaceId = await requireActiveWorkspaceId();

    const papers = await db.paper.findMany({
      where: {
        workspaceId: workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        venueType: true,
        status: true,
        createdAt: true,
        originalFileName: true,
      },
    });

    return NextResponse.json(papers);
  } catch (error) {
    console.error("Error fetching papers:", error);
    if (error instanceof Error && error.message === "No active workspace") {
      return NextResponse.json(
        { error: "No active workspace" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { message: "Failed to fetch papers" },
      { status: 500 }
    );
  }
}
