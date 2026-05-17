import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const s2Id = request.nextUrl.searchParams.get("s2Id");
  if (!s2Id) return NextResponse.json({ error: "s2Id required" }, { status: 400 });

  const paper = await db.externalPaper.findUnique({
    where: { semanticScholarId: s2Id },
    select: { id: true },
  });

  if (!paper) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id: paper.id });
}
