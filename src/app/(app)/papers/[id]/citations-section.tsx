"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";

interface Citation {
  id: string;
  raw: string;
  title: string | null;
  authors: string | null;
  year: number | null;
  venue: string | null;
  doi: string | null;
  arxivId: string | null;
  url: string | null;
  targetPaperId: string | null;
}

interface CitationsSectionProps {
  paperId: string;
  citations: Citation[];
  status: string | null;
  error: string | null;
  count: number | null;
  scannedPages?: string | null;
}

export function CitationsSection({
  paperId,
  citations,
  status,
  error,
  count,
  scannedPages,
}: CitationsSectionProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const router = useRouter();

  const handleExtract = async () => {
    setIsExtracting(true);
    try {
      const response = await fetch(`/api/papers/${paperId}/citations/reextract`, {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(`Extraction failed: ${data.error || "Unknown error"}`);
      }
    } catch {
      alert("Failed to extract citations");
    } finally {
      setIsExtracting(false);
    }
  };

  // NOT_STARTED or null
  if (!status || status === "NOT_STARTED") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            References / Citations
          </h2>
          <button
            onClick={handleExtract}
            disabled={isExtracting}
            className="px-3 py-1 bg-primary-500 text-white text-sm rounded hover:bg-primary-600 disabled:opacity-50 font-medium"
          >
            {isExtracting ? "Extracting..." : "Extract Citations"}
          </button>
        </div>
        <p className="text-sm text-gray-500">
          Citations not extracted yet. Click the button to extract references from this paper.
        </p>
      </div>
    );
  }

  // FAILED
  if (status === "FAILED") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            References / Citations
          </h2>
          <button
            onClick={handleExtract}
            disabled={isExtracting}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50 font-medium"
          >
            {isExtracting ? "Retrying..." : "Retry"}
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm text-red-800 font-medium">Citation extraction failed</p>
          {error && (
            <p className="text-xs text-red-600 mt-1 font-mono">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // DONE
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            References / Citations
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {count || citations.length} references found
          </p>
          {scannedPages && (
            <p className="text-xs text-gray-400 mt-0.5">
              Scanned pages: {scannedPages}
            </p>
          )}
        </div>
        <button
          onClick={handleExtract}
          disabled={isExtracting}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
          title="Re-extract citations"
        >
          <RefreshCcw className={`w-4 h-4 ${isExtracting ? "animate-spin" : ""}`} />
        </button>
      </div>

      {citations.length === 0 ? (
        <p className="text-sm text-gray-500">No citations found in this paper.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Title
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 w-20">
                  Year
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 w-32">
                  Links
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 w-32">
                  Internal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {citations.map((citation) => (
                <tr key={citation.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    {citation.title ? (
                      <span className="text-gray-900">{citation.title}</span>
                    ) : (
                      <span className="text-gray-600 text-xs truncate max-w-md block">
                        {citation.raw.substring(0, 100)}...
                      </span>
                    )}
                    {citation.authors && (
                      <div className="text-xs text-gray-500 mt-1">
                        {citation.authors}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {citation.year || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {citation.doi && (
                        <a
                          href={`https://doi.org/${citation.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                          title="DOI"
                        >
                          DOI
                        </a>
                      )}
                      {citation.arxivId && (
                        <a
                          href={`https://arxiv.org/abs/${citation.arxivId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                          title="arXiv"
                        >
                          arXiv
                        </a>
                      )}
                      {citation.url && (
                        <a
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                          title="URL"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {citation.targetPaperId ? (
                      <Link
                        href={`/papers/${citation.targetPaperId}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View Paper →
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
