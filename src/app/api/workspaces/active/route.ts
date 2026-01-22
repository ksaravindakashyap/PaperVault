import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, setActiveWorkspaceCookie, getWorkspaceMember, setUserIdCookie } from "@/lib/auth";
import { setActiveWorkspaceSchema } from "@/lib/validators";

// POST /api/workspaces/active
export async function POST(request: NextRequest) {
  // Get or create local user
  let user = await getCurrentUser();
  if (!user) {
    user = await db.user.create({
      data: {
        name: "Local User",
      },
    });
    await setUserIdCookie(user.id);
  }

  try {
    const body = await request.json();
    const validated = setActiveWorkspaceSchema.parse(body);

    // Verify user is a member of this workspace
    const member = await getWorkspaceMember(validated.workspaceId, user.id);
    if (!member) {
      return NextResponse.json(
        { error: "Not a member of this workspace" },
        { status: 403 }
      );
    }

    // Set active workspace cookie
    await setActiveWorkspaceCookie(validated.workspaceId);

    return NextResponse.json({
      workspaceId: validated.workspaceId,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }
    console.error("Failed to set active workspace:", error);
    return NextResponse.json(
      { error: "Failed to set active workspace" },
      { status: 500 }
    );
  }
}
