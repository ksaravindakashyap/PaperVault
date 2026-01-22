import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const papers = await db.paper.findMany({
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
    return NextResponse.json(
      { message: "Failed to fetch papers" },
      { status: 500 }
    );
  }
}
