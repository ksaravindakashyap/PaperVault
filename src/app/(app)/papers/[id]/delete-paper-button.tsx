"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeletePaperButtonProps {
  paperId: string;
  paperTitle: string | null;
}

export function DeletePaperButton({
  paperId,
  paperTitle,
}: DeletePaperButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/papers/${paperId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Navigate back to library
        router.push("/library");
        router.refresh();
      } else {
        const data = await response.json();
        alert(`Delete failed: ${data.error || "Unknown error"}`);
        setIsDeleting(false);
      }
    } catch {
      alert("Failed to delete paper");
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <button
          className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md border border-red-200 font-medium flex items-center gap-2 disabled:opacity-50"
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4" />
          {isDeleting ? "Deleting..." : "Delete Paper"}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white text-gray-900 border border-gray-200 shadow-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900">Delete Paper?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            This will permanently delete &ldquo;{paperTitle || "this paper"}&rdquo; and all its citations.
            The PDF file will also be removed from disk. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
