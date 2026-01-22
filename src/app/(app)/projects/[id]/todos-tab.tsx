"use client";

import { useState, useEffect } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { Plus, Check, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { TodoDialog } from "@/components/todo-dialog";

interface Todo {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  notes?: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface TodosTabProps {
  projectId: string;
  currentUserRole: string | null;
}

export function TodosTab({ projectId, currentUserRole }: TodosTabProps) {
  const { toast } = useToast();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scope, setScope] = useState<"week" | "all">("week");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const canEdit = currentUserRole === "EDITOR" || currentUserRole === "OWNER";

  const loadTodos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/todos?scope=${scope}`);
      if (response.ok) {
        const data = await response.json();
        setTodos(data);
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Failed to load todos",
          description: data.error || "An error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load todos",
        description: "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, [projectId, scope]);

  const handleCreateTodo = () => {
    setEditingTodo(null);
    setIsDialogOpen(true);
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setIsDialogOpen(true);
  };

  const handleSaveTodo = async (data: { title: string; dueDate: string; notes?: string }) => {
    setIsSaving(true);
    try {
      if (editingTodo) {
        // Update existing todo
        const response = await fetch(`/api/todos/${editingTodo.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          toast({
            title: "Todo updated",
            description: "The todo has been updated successfully",
          });
          loadTodos();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update todo");
        }
      } else {
        // Create new todo
        const response = await fetch(`/api/projects/${projectId}/todos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          toast({
            title: "Todo created",
            description: "The todo has been created successfully",
          });
          loadTodos();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create todo");
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: editingTodo ? "Failed to update todo" : "Failed to create todo",
        description: error instanceof Error ? error.message : "An error occurred",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (todo: Todo) => {
    if (!canEdit) return;

    const newStatus = todo.status === "OPEN" ? "DONE" : "OPEN";
    setTogglingStatus(todo.id);

    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, status: newStatus } : t))
    );

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: "Todo updated",
          description: `Marked as ${newStatus}`,
        });
        loadTodos();
      } else {
        // Revert optimistic update
        setTodos((prev) =>
          prev.map((t) => (t.id === todo.id ? { ...t, status: todo.status } : t))
        );
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Failed to update todo",
          description: data.error || "An error occurred",
        });
      }
    } catch (error) {
      // Revert optimistic update
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, status: todo.status } : t))
      );
      toast({
        variant: "destructive",
        title: "Failed to update todo",
        description: "An error occurred",
      });
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleDeleteTodo = async () => {
    if (!todoToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/todos/${todoToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Todo deleted",
          description: "The todo has been deleted successfully",
        });
        loadTodos();
        setTodoToDelete(null);
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Failed to delete todo",
          description: data.error || "An error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete todo",
        description: "An error occurred",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleNotes = (todoId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(todoId)) {
        next.delete(todoId);
      } else {
        next.add(todoId);
      }
      return next;
    });
  };

  // Group todos by date
  const groupedTodos = todos.reduce((acc, todo) => {
    const date = format(parseISO(todo.dueDate), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(todo);
    return acc;
  }, {} as Record<string, Todo[]>);

  const sortedDates = Object.keys(groupedTodos).sort();

  const formatDateHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (isSameDay(date, today)) {
      return `Today, ${format(date, "MMM d")}`;
    } else if (isSameDay(date, tomorrow)) {
      return `Tomorrow, ${format(date, "MMM d")}`;
    } else {
      return format(date, "EEE, MMM d");
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Todos</h2>
        <div className="flex items-center gap-3">
          {/* Scope Toggle */}
          <div className="flex items-center gap-1 border border-gray-300 rounded-md p-1 bg-white">
            <Button
              variant={scope === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setScope("week")}
              className={scope === "week" ? "bg-primary text-white" : ""}
            >
              This week
            </Button>
            <Button
              variant={scope === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setScope("all")}
              className={scope === "all" ? "bg-primary text-white" : ""}
            >
              All
            </Button>
          </div>

          {/* New Todo Button */}
          {canEdit && (
            <Button onClick={handleCreateTodo}>
              <Plus className="w-4 h-4 mr-2" />
              New Todo
            </Button>
          )}
        </div>
      </div>

      {/* Todos List */}
      {todos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {scope === "week"
              ? "No todos due this week"
              : "No todos yet"}
          </p>
          {canEdit && scope === "all" && (
            <Button onClick={handleCreateTodo} className="mt-4" variant="outline">
              Create your first todo
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => (
            <div key={dateStr} className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                {formatDateHeader(dateStr)}
              </h3>
              <div className="space-y-2">
                {groupedTodos[dateStr].map((todo) => (
                  <div
                    key={todo.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-md border",
                      todo.status === "DONE"
                        ? "bg-gray-50 border-gray-200"
                        : "bg-white border-gray-200"
                    )}
                  >
                    {/* Checkbox */}
                    {canEdit ? (
                      <Checkbox
                        checked={todo.status === "DONE"}
                        onCheckedChange={() => handleToggleStatus(todo)}
                        disabled={togglingStatus === todo.id}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 w-4 h-4 flex items-center justify-center">
                        {todo.status === "DONE" ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded" />
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4
                            className={cn(
                              "font-medium",
                              todo.status === "DONE"
                                ? "text-gray-500 line-through"
                                : "text-gray-900"
                            )}
                          >
                            {todo.title}
                          </h4>
                          {todo.notes && (
                            <div className="mt-1">
                              {expandedNotes.has(todo.id) ? (
                                <div>
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                    {todo.notes}
                                  </p>
                                  <button
                                    onClick={() => toggleNotes(todo.id)}
                                    className="text-xs text-primary hover:underline mt-1"
                                  >
                                    Show less
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm text-gray-500 line-clamp-1">
                                    {todo.notes}
                                  </p>
                                  {todo.notes.length > 50 && (
                                    <button
                                      onClick={() => toggleNotes(todo.id)}
                                      className="text-xs text-primary hover:underline mt-1"
                                    >
                                      Show more
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {canEdit && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTodo(todo)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setTodoToDelete(todo)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <TodoDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingTodo(null);
        }}
        onSave={handleSaveTodo}
        initialData={editingTodo}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!todoToDelete}
        onOpenChange={(open) => !open && setTodoToDelete(null)}
      >
        <AlertDialogContent className="bg-white text-gray-900 border border-gray-200 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Delete Todo?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              This will permanently delete &ldquo;{todoToDelete?.title}&rdquo;. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTodo}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
