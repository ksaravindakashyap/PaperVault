import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess } from "@/lib/auth";
import { createTodoSchema } from "@/lib/validators";

// Helper to get start and end of current week (Monday 00:00 to Sunday 23:59)
function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  // Calculate days to subtract to get to Monday (0=Sunday, 1=Monday, etc.)
  const daysToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { start: monday, end: sunday };
}

// GET /api/projects/[id]/todos?scope=week|all
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const access = await requireProjectAccess(id, user?.id || null);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "week";

    let whereClause: any = { projectId: id };

    if (scope === "week") {
      const { start, end } = getWeekBounds();
      whereClause.dueDate = {
        gte: start,
        lte: end,
      };
    }

    const todos = await db.todo.findMany({
      where: whereClause,
      orderBy: [
        { dueDate: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json(
      todos.map((todo) => ({
        id: todo.id,
        title: todo.title,
        dueDate: todo.dueDate.toISOString(),
        status: todo.status,
        notes: todo.notes,
        createdBy: todo.createdBy,
        updatedBy: todo.updatedBy,
        createdAt: todo.createdAt.toISOString(),
        updatedAt: todo.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Failed to fetch todos:", error);
    return NextResponse.json(
      { error: "Failed to fetch todos" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/todos
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const access = await requireProjectAccess(id, user?.id || null, "EDITOR");
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = createTodoSchema.parse(body);

    // Create todo
    const todo = await db.todo.create({
      data: {
        projectId: id,
        title: validated.title,
        dueDate: new Date(validated.dueDate),
        notes: validated.notes || null,
        createdBy: user!.id,
        updatedBy: user!.id,
      },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        projectId: id,
        actorId: user!.id,
        action: "TODO_CREATED",
        metadata: JSON.stringify({
          todoId: todo.id,
          title: todo.title,
          dueDate: todo.dueDate.toISOString(),
        }),
      },
    });

    return NextResponse.json(
      {
        id: todo.id,
        title: todo.title,
        dueDate: todo.dueDate.toISOString(),
        status: todo.status,
        notes: todo.notes,
        createdBy: todo.createdBy,
        updatedBy: todo.updatedBy,
        createdAt: todo.createdAt.toISOString(),
        updatedAt: todo.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }
    console.error("Failed to create todo:", error);
    return NextResponse.json(
      { error: "Failed to create todo" },
      { status: 500 }
    );
  }
}
