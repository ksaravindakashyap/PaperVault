"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { useDemo } from "@/demo/demo-provider";

export default function DemoPaperDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { id } = params;
  const { getPaper, getPaperTags, getCitations } = useDemo();
  const [paper, setPaper] = useState<{ id: string; title: string; status: string; venueType: string; year: number | null; abstract?: string; summary?: string; authors?: string; doi?: string; arxivId?: string; bibtex?: string } | null>(null);
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([]);
  const [citations, setCitations] = useState<Array<{ id: string; raw: string; title?: string }>>([]);

  useEffect(() => {
    if (id && typeof id === "string") {
      const paperData = getPaper(id);
      if (paperData) {
        setPaper(paperData);
        setTags(getPaperTags(id));
        setCitations(getCitations(id));
      }
    }
  }, [id, getPaper, getPaperTags, getCitations]);

  const fromPath = searchParams.get("from") || "/demo/library";

  if (!paper) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-500">Paper not found</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PROCESSING: "bg-primary-100 text-primary-700",
      READY: "bg-green-100 text-green-700",
      FAILED: "bg-red-100 text-red-700",
      TO_READ: "bg-blue-100 text-blue-700",
      SKIMMED: "bg-yellow-100 text-yellow-700",
      DEEP_READ: "bg-purple-100 text-purple-700",
      INTEGRATED: "bg-indigo-100 text-indigo-700",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href={fromPath}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {paper.title}
            </h1>
            <div className="flex items-center gap-3 mb-4">
              {getStatusBadge(paper.status)}
              <span className="text-sm text-gray-500">
                {paper.venueType.replace(/_/g, " ")}
              </span>
              {paper.year && (
                <span className="text-sm text-gray-500">{paper.year}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md text-orange-700 text-sm">
            <Info className="w-4 h-4" />
            <span>Demo mode: read-only</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {paper.abstract && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Abstract
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {paper.abstract}
                </p>
              </div>
            )}

            {paper.summary && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Summary
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {paper.summary}
                </p>
              </div>
            )}

            {citations.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Citations ({citations.length})
                </h2>
                <div className="space-y-3">
                  {citations.map((citation) => (
                    <div
                      key={citation.id}
                      className="border-l-4 border-orange-500 pl-4 py-2"
                    >
                      <p className="text-sm text-gray-700">{citation.raw}</p>
                      {citation.title && (
                        <p className="text-xs text-gray-500 mt-1">
                          {citation.title}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Metadata</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Authors</dt>
                  <dd className="text-sm text-gray-900 mt-1">{paper.authors}</dd>
                </div>
                {paper.year && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Year</dt>
                    <dd className="text-sm text-gray-900 mt-1">{paper.year}</dd>
                  </div>
                )}
                {paper.doi && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">DOI</dt>
                    <dd className="text-sm text-gray-900 mt-1">{paper.doi}</dd>
                  </div>
                )}
                {paper.arxivId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      arXiv ID
                    </dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {paper.arxivId}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {tags.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {paper.bibtex && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">BibTeX</h3>
                <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
                  {paper.bibtex}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
