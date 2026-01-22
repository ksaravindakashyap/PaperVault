"use client";

import { useState, useEffect } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TodoDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; dueDate: string; notes?: string }) => Promise<void>;
  initialData?: {
    id: string;
    title: string;
    dueDate: string;
    notes?: string | null;
  } | null;
  isSaving?: boolean;
}

export function TodoDialog({
  open,
  onClose,
  onSave,
  initialData,
  isSaving = false,
}: TodoDialogProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string }>({});

  // Initialize form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title);
        setDueDate(new Date(initialData.dueDate));
        setNotes(initialData.notes || "");
      } else {
        setTitle("");
        setDueDate(undefined);
        setNotes("");
      }
      setErrors({});
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    // Reset errors
    setErrors({});

    // Validate
    const newErrors: { title?: string; dueDate?: string } = {};
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    if (title.length > 140) {
      newErrors.title = "Title must be less than 140 characters";
    }
    if (!dueDate) {
      newErrors.dueDate = "Due date is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit
    try {
      await onSave({
        title: title.trim(),
        dueDate: dueDate!.toISOString(),
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (error) {
      // Error handling is done in parent
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white text-gray-900 border border-gray-200 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {initialData ? "Edit Todo" : "New Todo"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {initialData
              ? "Update the todo details"
              : "Create a new task for this project"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="todo-title" className="text-gray-900">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="todo-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: undefined });
              }}
              placeholder="Enter todo title"
              maxLength={140}
              className={cn("bg-white", errors.title && "border-red-500")}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}
            <p className="text-xs text-gray-500">{title.length} / 140 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="todo-due-date" className="text-gray-900">
              Due Date <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white",
                    !dueDate && "text-gray-500",
                    errors.dueDate && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    if (errors.dueDate) setErrors({ ...errors, dueDate: undefined });
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.dueDate && (
              <p className="text-sm text-red-600">{errors.dueDate}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="todo-notes" className="text-gray-900">
              Notes (optional)
            </Label>
            <Textarea
              id="todo-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={4}
              maxLength={2000}
              className="bg-white"
            />
            <p className="text-xs text-gray-500">{notes.length} / 2000 characters</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || !title.trim() || !dueDate}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
