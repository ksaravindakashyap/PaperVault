import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireProjectAccess } from "@/lib/auth";
import { updateTodoSchema } from "@/lib/validators";

// PATCH /api/todos/[todoId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
) {
  const { todoId } = await params;
  const user = await getCurrentUser();

  try {
    // Get todo to find project
    const todo = await db.todo.findUnique({
      where: { id: todoId },
    });

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    // Check access (EDITOR or OWNER)
    const access = await requireProjectAccess(
      todo.projectId,
      user?.id || null,
      "EDITOR"
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateTodoSchema.parse(body);

    // Build update data
    const updateData: any = {
      updatedBy: user!.id,
    };

    if (validated.title !== undefined) {
      updateData.title = validated.title;
    }
    if (validated.dueDate !== undefined) {
      updateData.dueDate = new Date(validated.dueDate);
    }
    if (validated.notes !== undefined) {
      updateData.notes = validated.notes;
    }
    if (validated.status !== undefined) {
      updateData.status = validated.status;
    }

    // Update todo
    const updated = await db.todo.update({
      where: { id: todoId },
      data: updateData,
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        projectId: todo.projectId,
        actorId: user!.id,
        action: "TODO_UPDATED",
        metadata: JSON.stringify({
          todoId: todo.id,
          changes: Object.keys(updateData).filter((k) => k !== "updatedBy"),
        }),
      },
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      dueDate: updated.dueDate.toISOString(),
      status: updated.status,
      notes: updated.notes,
      updatedBy: updated.updatedBy,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 }
      );
    }
    console.error("Failed to update todo:", error);
    return NextResponse.json(
      { error: "Failed to update todo" },
      { status: 500 }
    );
  }
}

// DELETE /api/todos/[todoId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
) {
  const { todoId } = await params;
  const user = await getCurrentUser();

  try {
    // Get todo to find project
    const todo = await db.todo.findUnique({
      where: { id: todoId },
    });

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    // Check access (EDITOR or OWNER)
    const access = await requireProjectAccess(
      todo.projectId,
      user?.id || null,
      "EDITOR"
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 });
    }

    // Delete todo
    await db.todo.delete({
      where: { id: todoId },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        projectId: todo.projectId,
        actorId: user!.id,
        action: "TODO_DELETED",
        metadata: JSON.stringify({
          todoId: todo.id,
          title: todo.title,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete todo:", error);
    return NextResponse.json(
      { error: "Failed to delete todo" },
      { status: 500 }
    );
  }
}
