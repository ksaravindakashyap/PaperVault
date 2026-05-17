import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireActiveWorkspaceId } from "@/lib/auth";

const READING_STATUSES = ["READY", "TO_READ", "SKIMMED", "DEEP_READ", "INTEGRATED"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    const { id } = await params;
    const { status } = await request.json();

    if (!READING_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const paper = await db.paper.findFirst({
      where: { id, workspaceId },
      select: { id: true },
    });

    if (!paper) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.paper.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Status update failed:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    const { id } = await params;

    const paper = await db.paper.findFirst({
      where: { id, workspaceId },
      select: { id: true },
    });

    if (!paper) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.paper.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json({ error: "Failed to delete paper" }, { status: 500 });
  }
}
