"use client";

import { useState } from "react";

interface SummaryEditorProps {
  paperId: string;
  initialSummary: string | null;
}

export function SummaryEditor({ paperId, initialSummary }: SummaryEditorProps) {
  const [summary, setSummary] = useState(initialSummary || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/papers/${paperId}/summary`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ summary }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save summary");
      }

      setMessage({ type: "success", text: "Summary saved successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save summary",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Summary Space</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 font-medium disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Write your research notes, summary, and insights here..."
        className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
      />

      <p className="text-xs text-gray-500 mt-2">
        Plain text for now. Collaborative editing coming in Step 2.
      </p>
    </div>
  );
}
