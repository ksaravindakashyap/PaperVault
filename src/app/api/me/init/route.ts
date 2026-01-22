import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setUserIdCookie } from "@/lib/auth";
import { z } from "zod";

const initUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = initUserSchema.parse(body);

    // Create user
    const user = await db.user.create({
      data: {
        name: validated.name,
      },
    });

    // Set cookie
    await setUserIdCookie(user.id);

    return NextResponse.json({
      id: user.id,
      name: user.name,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to initialize user:", error);
    return NextResponse.json(
      { error: "Failed to initialize user" },
      { status: 500 }
    );
  }
}
