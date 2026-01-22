"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface UploadPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VENUE_TYPES = [
  "ACL",
  "NEURIPS",
  "ICML",
  "ICLR",
  "EMNLP",
  "NAACL",
  "USENIX_SECURITY",
  "CCS",
  "NDSS",
  "CHI",
  "IEEE_GENERIC",
  "OTHER",
] as const;

export function UploadPaperModal({ isOpen, onClose }: UploadPaperModalProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [venueType, setVenueType] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!file || !venueType) {
      setError("Please select a file and venue type");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("venueType", venueType);

      const response = await fetch("/api/papers/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      // Success - close modal and refresh
      onClose();
      router.refresh();
      
      // Reset form
      setFile(null);
      setVenueType("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setVenueType("");
      setError("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Upload Paper</h2>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="file"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                PDF File *
              </label>
              <input
                type="file"
                id="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                disabled={isUploading}
              />
            </div>

            <div>
              <label
                htmlFor="venueType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Conference/Venue Type *
              </label>
              <select
                id="venueType"
                value={venueType}
                onChange={(e) => setVenueType(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                disabled={isUploading}
              >
                <option value="">Select venue type...</option>
                {VENUE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Project (Coming Soon)
              </label>
              <select
                disabled
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              >
                <option>No projects yet</option>
              </select>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-600 disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
