"use client";

import { useState } from "react";

interface AbstractCardProps {
  abstract: string | null;
}

export function AbstractCard({ abstract }: AbstractCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!abstract) return;

    try {
      await navigator.clipboard.writeText(abstract);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const hasAbstract = abstract && abstract.trim().length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Abstract</h2>
        <button
          onClick={handleCopy}
          disabled={!hasAbstract}
          className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
            hasAbstract
              ? "bg-primary-500 text-white hover:bg-primary-600"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
          aria-label={hasAbstract ? "Copy abstract" : "No abstract to copy"}
          title={hasAbstract ? "Copy abstract" : "No abstract available"}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div
        className={`max-h-72 overflow-y-auto ${
          hasAbstract ? "text-sm text-gray-700 leading-6" : "text-sm text-gray-400"
        }`}
      >
        {hasAbstract ? (
          <div className="whitespace-pre-wrap">{abstract}</div>
        ) : (
          <div className="text-center py-8">
            No abstract extracted yet. Process this paper to extract metadata.
          </div>
        )}
      </div>
    </div>
  );
}
