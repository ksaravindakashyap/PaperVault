"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDemo } from "@/demo/demo-provider";
import Link from "next/link";
import { FileText, List, BookOpen } from "lucide-react";
import { Info } from "lucide-react";

export default function DemoSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { search } = useDemo();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: string; type: string; title: string; url: string; snippet?: string; tags?: string[] }>>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "papers",
    "docs",
    "todos",
    "citations",
  ]);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    if (q) {
      const searchResults = search(q, selectedTypes);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  }, [searchParams, search, selectedTypes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/demo/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "paper":
        return <FileText className="w-5 h-5 text-orange-500" />;
      case "doc":
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      case "todo":
        return <List className="w-5 h-5 text-green-500" />;
      case "citation":
        return <FileText className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Search</h1>
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md text-orange-700 text-sm">
            <Info className="w-4 h-4" />
            <span>Demo mode: read-only</span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search papers, docs, todos, citations..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Search
            </button>
          </div>
        </form>

        <div className="mb-4 flex gap-2 flex-wrap">
          {["papers", "docs", "todos", "citations"].map((type) => (
            <button
              key={type}
              onClick={() => {
                if (selectedTypes.includes(type)) {
                  setSelectedTypes(selectedTypes.filter((t) => t !== type));
                } else {
                  setSelectedTypes([...selectedTypes, type]);
                }
              }}
              className={`px-3 py-1 rounded-md text-sm ${
                selectedTypes.includes(type)
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {results.length === 0 && query ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No results found</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result) => (
              <Link
                key={result.id}
                href={result.url}
                className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {getTypeIcon(result.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {result.title}
                      </h3>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {result.type}
                      </span>
                    </div>
                    {result.snippet && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {result.snippet}
                      </p>
                    )}
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Enter a search query to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
