"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDemo } from "@/demo/demo-provider";
import { Info } from "lucide-react";

export default function DemoLibraryPage() {
  const { getPapers, getPaperTags } = useDemo();
  const [papers, setPapers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const demoPapers = getPapers().map(paper => ({
      ...paper,
      tags: getPaperTags(paper.id).map(t => t.name),
    }));
    setPapers(demoPapers);
    setIsLoading(false);
  }, [getPapers, getPaperTags]);

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
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Library</h1>
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md text-orange-700 text-sm">
            <Info className="w-4 h-4" />
            <span>Demo mode: read-only</span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : papers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No papers in demo dataset</p>
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
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {papers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/demo/papers/${paper.id}`}
                        className="text-sm text-gray-900 hover:text-primary"
                      >
                        {paper.title}
                      </Link>
                      {paper.tags && paper.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {paper.tags.slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {paper.venueType.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {paper.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(paper.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
