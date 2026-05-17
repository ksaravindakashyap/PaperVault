"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, FileText, CheckSquare, Link as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchResult {
  type: "paper" | "doc" | "todo" | "citation";
  id: string;
  title: string;
  snippet?: string;
  projectId?: string;
  paperId?: string;
  url: string;
  score: number;
  tags?: string[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [scope, setScope] = useState<"all" | "project">("all");
  const [projectId, setProjectId] = useState<string>("");
  const [types, setTypes] = useState<Set<string>>(new Set(["papers", "docs", "todos", "citations"]));
  const [venue, setVenue] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [tag, setTag] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);

  const debouncedQuery = useDebounce(query, 300);

  // Load user's projects
  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
        }
      })
      .catch(console.error);
  }, []);

  // Sync query from URL on mount
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [searchParams]);

  // Perform search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const params = new URLSearchParams({
      q: debouncedQuery.trim(),
      scope,
      types: Array.from(types).length > 0 ? Array.from(types).join(",") : "papers,docs,todos,citations",
      limit: "50",
    });

    if (scope === "project" && projectId) {
      params.set("projectId", projectId);
    }
    if (venue && venue !== "all") params.set("venue", venue);
    if (status && status !== "all") params.set("status", status);
    if (tag) params.set("tag", tag);

    fetch(`/api/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("Search error:", data.error);
          setResults([]);
        } else {
          setResults(data.results || []);
          if (data.debug) {
            console.log("Search debug:", data.debug);
          }
        }
      })
      .catch((error) => {
        console.error("Search failed:", error);
        setResults([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [debouncedQuery, scope, projectId, types, venue, status, tag]);

  const handleTypeToggle = (type: string) => {
    const newTypes = new Set(types);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setTypes(newTypes);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "paper":
        return <FileText className="w-4 h-4" />;
      case "doc":
        return <FileText className="w-4 h-4" />;
      case "todo":
        return <CheckSquare className="w-4 h-4" />;
      case "citation":
        return <LinkIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Search your library</h1>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search papers, docs, todos, citations..."
              className="pl-10 pr-4 py-6 text-lg"
              autoFocus
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Searching your uploaded papers, docs, and todos. Use the header search bar for AI-powered discovery.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Scope */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Scope</label>
              <Select value={scope} onValueChange={(v) => setScope(v as "all" | "project")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project (if scope is project) */}
            {scope === "project" && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Project</label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Venue */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Venue</label>
              <Select value={venue || "all"} onValueChange={(v) => setVenue(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All venues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All venues</SelectItem>
                  <SelectItem value="ACL">ACL</SelectItem>
                  <SelectItem value="NEURIPS">NeurIPS</SelectItem>
                  <SelectItem value="ICML">ICML</SelectItem>
                  <SelectItem value="ICLR">ICLR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="READY">Ready</SelectItem>
                  <SelectItem value="TO_READ">To Read</SelectItem>
                  <SelectItem value="SKIMMED">Skimmed</SelectItem>
                  <SelectItem value="DEEP_READ">Deep Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Types */}
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Types</label>
            <div className="flex gap-4">
              {["papers", "docs", "todos", "citations"].map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    checked={types.has(type)}
                    onCheckedChange={() => handleTypeToggle(type)}
                  />
                  <label className="text-sm text-gray-700 capitalize">{type}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Searching...</div>
        ) : query.trim() && results.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No results found</div>
        ) : query.trim() ? (
          <div className="space-y-6">
            {Object.entries(groupedResults).map(([type, typeResults]) => (
              <div key={type}>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
                  {type} ({typeResults.length})
                </h2>
                <div className="space-y-2">
                  {typeResults.map((result) => (
                    <Link
                      key={result.id}
                      href={result.url}
                      className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-orange-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getIcon(result.type)}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 mb-1">{result.title}</h3>
                          {result.snippet && (
                            <p className="text-sm text-gray-600 line-clamp-2">{result.snippet}</p>
                          )}
                          {result.tags && result.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {result.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs"
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
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Enter a search query to get started
          </div>
        )}
      </div>
    </div>
  );
}
