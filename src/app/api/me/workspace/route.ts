import { NextRequest, NextResponse } from "next/server";
import { requireActiveWorkspace } from "@/lib/auth";

// GET /api/me/workspace
export async function GET(request: NextRequest) {
  const result = await requireActiveWorkspace();

  if (!result.hasWorkspace) {
    return NextResponse.json({
      hasWorkspace: false,
      workspaceId: null,
    });
  }

  return NextResponse.json({
    hasWorkspace: true,
    workspaceId: result.workspaceId,
  });
}
