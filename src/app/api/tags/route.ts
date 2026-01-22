import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireActiveWorkspaceId, setUserIdCookie } from "@/lib/auth";
import { z } from "zod";

const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50, "Tag name must be less than 50 characters"),
});

// GET /api/tags?q=prefix
export async function GET(request: NextRequest) {
  try {
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

    const workspaceId = await requireActiveWorkspaceId();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const tags = await db.tag.findMany({
      where: {
        workspaceId: workspaceId,
        name: {
          contains: query,
        },
      },
      take: 10,
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(
      tags.map((tag: { id: string; name: string }) => ({
        id: tag.id,
        name: tag.name,
      }))
    );
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

// POST /api/tags
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const validated = createTagSchema.parse(body);

    const workspaceId = await requireActiveWorkspaceId();

    // Normalize tag name (lowercase, trim)
    const normalizedName = validated.name.trim().toLowerCase();

    // Check if tag already exists in this workspace
    const existing = await db.tag.findUnique({
      where: {
        workspaceId_name: {
          workspaceId: workspaceId,
          name: normalizedName,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        id: existing.id,
        name: existing.name,
      });
    }

    // Create new tag
    const tag = await db.tag.create({
      data: {
        workspaceId: workspaceId,
        name: normalizedName,
      },
    });

    return NextResponse.json(
      {
        id: tag.id,
        name: tag.name,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to create tag:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}
