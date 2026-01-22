"use client";

import { useState, useEffect } from "react";
import { UploadPaperModal } from "@/components/upload-paper-modal";
import Link from "next/link";
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
} from "@/components/ui/alert-dialog";

interface Paper {
  id: string;
  title: string | null;
  venueType: string;
  status: string;
  createdAt: string;
  originalFileName: string;
}

export default function LibraryPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPaper, setProcessingPaper] = useState<string | null>(null);
  const [deletingPaper, setDeletingPaper] = useState<string | null>(null);
  const [paperToDelete, setPaperToDelete] = useState<Paper | null>(null);

  const loadPapers = async () => {
    try {
      const response = await fetch("/api/papers");
      if (response.ok) {
        const data = await response.json();
        setPapers(data);
      }
    } catch (error) {
      console.error("Failed to load papers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPapers();
  }, []);

  const handleModalClose = () => {
    setIsModalOpen(false);
    loadPapers(); // Reload papers after upload
  };

  const handleReprocess = async (paperId: string, force: boolean = false) => {
    setProcessingPaper(paperId);
    try {
      const url = force
        ? `/api/papers/${paperId}/process?force=1`
        : `/api/papers/${paperId}/process`;
      const response = await fetch(url, { method: "POST" });
      const data = await response.json();

      if (response.ok) {
        alert("Processing completed successfully!");
        loadPapers();
      } else {
        alert(`Processing failed: ${data.message || data.error}`);
      }
    } catch {
      alert("Failed to trigger processing");
    } finally {
      setProcessingPaper(null);
    }
  };

  const handleDeleteClick = (paper: Paper) => {
    setPaperToDelete(paper);
  };

  const handleDeleteConfirm = async () => {
    if (!paperToDelete) return;

    setDeletingPaper(paperToDelete.id);
    try {
      const response = await fetch(`/api/papers/${paperToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadPapers();
        alert("Paper deleted successfully");
      } else {
        const data = await response.json();
        alert(`Delete failed: ${data.error || "Unknown error"}`);
      }
    } catch {
      alert("Failed to delete paper");
    } finally {
      setDeletingPaper(null);
      setPaperToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PROCESSING: "bg-primary-100 text-primary-700",
      READY: "bg-green-100 text-green-700",
      FAILED: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700"}`}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Library</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 font-medium"
          >
            Upload Paper
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : papers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No papers yet</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-primary hover:text-primary-700 font-medium"
            >
              Upload your first paper
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venue Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {papers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/papers/${paper.id}?from=/library`}
                        className="text-sm text-gray-900 hover:text-primary"
                      >
                        {paper.title || "Untitled (processing)"}
                      </Link>
                      {paper.status === "PROCESSING" && (
                        <p className="text-xs text-gray-500 mt-1">
                          Run npm worker to process metadata
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {paper.venueType.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(paper.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(paper.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            handleReprocess(
                              paper.id,
                              paper.status === "READY"
                            )
                          }
                          disabled={processingPaper === paper.id}
                          className="text-primary hover:text-primary-700 font-medium disabled:opacity-50"
                        >
                          {processingPaper === paper.id
                            ? "Processing..."
                            : paper.status === "READY"
                              ? "Reprocess"
                              : "Process Now"}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(paper)}
                          disabled={deletingPaper === paper.id}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50"
                          title="Delete paper"
                        >
                          {deletingPaper === paper.id ? (
                            <span className="text-xs">Deleting...</span>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UploadPaperModal isOpen={isModalOpen} onClose={handleModalClose} />

      <AlertDialog open={!!paperToDelete} onOpenChange={(open) => !open && setPaperToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Paper?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{paperToDelete?.title || paperToDelete?.originalFileName}&rdquo; and all its citations.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
