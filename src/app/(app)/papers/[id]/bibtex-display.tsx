"use client";

import { useState } from "react";

interface BibTeXDisplayProps {
  bibtex: string | null;
}

export function BibTeXDisplay({ bibtex }: BibTeXDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (bibtex) {
      navigator.clipboard.writeText(bibtex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!bibtex) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">BibTeX</h2>
        <p className="text-sm text-gray-500">
          BibTeX will be generated after metadata extraction
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">BibTeX</h2>
        <button
          onClick={handleCopy}
          className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary-600 font-medium"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="bg-gray-50 p-4 rounded-md text-xs overflow-x-auto font-mono">
        {bibtex}
      </pre>
    </div>
  );
}
