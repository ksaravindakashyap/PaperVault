"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, BookOpen, Sparkles, ChevronDown, ChevronUp, ExternalLink, SlidersHorizontal, Zap, Database, BookmarkPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Decomposition {
  intent: string;
  keywords: string[];
  venues: string[];
  yearRange: { from?: number; to?: number };
  topics: string[];
  fieldsOfStudy: string[];
}

interface ExternalPaper {
  id: string;
  title: string;
  authors: string;
  year: number | null;
  venue: string | null;
  abstract: string | null;
  citationCount: number | null;
  tldr: string | null;
  semanticScholarId: string | null;
  arxivId: string | null;
}

interface AgenticSearchResult {
  sessionId: string;
  query: string;
  decomposition: Decomposition;
  results: {
    total: number;
    byConference: Record<string, ExternalPaper[]>;
    byYear: Record<string, ExternalPaper[]>;
    papers: ExternalPaper[];
    semanticMatches: Array<ExternalPaper & { similarity: number }>;
  };
  metadata: {
    searchedVenues: string[];
    yearRange: { from?: number; to?: number };
    keywords: string[];
    intent: string;
    hasSemanticReranking: boolean;
    queryType: "lookup" | "explore";
    cacheHit?: boolean;
  };
}

interface Props {
  /** Render the trigger button. Set false when the dialog is mounted at layout level. */
  showTrigger?: boolean;
}

export function AgenticSearchDialog({ showTrigger = true }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgenticSearchResult | null>(null);
  const [expandedConf, setExpandedConf] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"papers" | "semantic">("papers");
  const [addedPapers, setAddedPapers] = useState<Set<string>>(new Set());
  const [addingPapers, setAddingPapers] = useState<Set<string>>(new Set());

  // Ref-based flag so the event handler can tell the open-effect to auto-search
  const shouldAutoSearch = useRef(false);

  // Core search function — takes the query as a direct param to avoid stale closures
  const executeSearch = useCallback(async (q: string, yf = yearFrom, yt = yearTo) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/search/agentic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q.trim(),
          yearFrom: yf ? parseInt(yf) : undefined,
          yearTo: yt ? parseInt(yt) : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.details ? `${data.error}: ${data.details}` : (data.error || "Search failed"));
        return;
      }

      setResult(data as AgenticSearchResult);
      setActiveTab("papers");
      const firstConf = Object.keys((data as AgenticSearchResult).results.byConference)[0];
      if (firstConf) setExpandedConf(firstConf);
    } catch {
      setError("Network error — check your API keys in .env.local");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const handleSearch = () => executeSearch(query, yearFrom, yearTo);

  // Listen for global openAISearch event dispatched by the header
  useEffect(() => {
    const handleGlobalOpen = (e: Event) => {
      const q = (e as CustomEvent<{ query: string }>).detail?.query ?? "";
      setQuery(q);
      setOpen(true);
      if (q.trim()) shouldAutoSearch.current = true;
    };
    window.addEventListener("openAISearch", handleGlobalOpen);
    return () => window.removeEventListener("openAISearch", handleGlobalOpen);
  }, []);

  // Auto-search when dialog opens with a pre-filled query from the header
  useEffect(() => {
    if (!open || !shouldAutoSearch.current) return;
    shouldAutoSearch.current = false;
    const q = query;
    if (q.trim()) executeSearch(q, "", "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const addToLibrary = async (paper: ExternalPaper) => {
    if (addedPapers.has(paper.id) || addingPapers.has(paper.id)) return;
    setAddingPapers((prev) => new Set(prev).add(paper.id));
    try {
      const res = await fetch("/api/library/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalPaperId: paper.id }),
      });
      if (res.ok) setAddedPapers((prev) => new Set(prev).add(paper.id));
    } finally {
      setAddingPapers((prev) => { const s = new Set(prev); s.delete(paper.id); return s; });
    }
  };

  const parseAuthors = (authorsJson: string): string => {
    try {
      const arr = JSON.parse(authorsJson);
      if (Array.isArray(arr)) {
        return arr
          .map((a: { name?: string } | string) => (typeof a === "string" ? a : a.name || ""))
          .filter(Boolean)
          .slice(0, 4)
          .join(", ") + (arr.length > 4 ? " et al." : "");
      }
      return authorsJson;
    } catch {
      return authorsJson;
    }
  };

  const getPaperUrl = (paper: { arxivId?: string | null; semanticScholarId?: string | null }) => {
    if (paper.arxivId) return `https://arxiv.org/abs/${paper.arxivId}`;
    if (paper.semanticScholarId) return `https://www.semanticscholar.org/paper/${paper.semanticScholarId}`;
    return null;
  };

  const isLookup = result?.metadata.queryType === "lookup";
  const isCacheHit = result?.metadata.cacheHit;

  const dialogContent = (
    <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white">
      <DialogHeader className="shrink-0">
        <DialogTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-orange-500" />
          AI Research Search
        </DialogTitle>
        <p className="text-sm text-gray-500">
          Describe your research interest or type a paper title — routes your query automatically
        </p>
      </DialogHeader>

      {/* Search input */}
      <div className="flex gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder='e.g. "Attention Is All You Need" or recent papers on LLM alignment'
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            autoFocus
          />
        </div>
        <button
          onClick={() => setShowFilters((f) => !f)}
          className={`px-3 border rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
            showFilters || yearFrom || yearTo
              ? "bg-orange-50 border-orange-300 text-orange-700"
              : "border-gray-200 text-gray-500 hover:border-gray-300"
          }`}
          title="Year filters"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
        </button>
        <Button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* Year filters */}
      {showFilters && (
        <div className="flex items-center gap-3 px-1 shrink-0">
          <span className="text-xs text-gray-500 font-medium">Year range:</span>
          <input
            type="number"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            placeholder="From"
            min={1950}
            max={2026}
            className="w-24 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <span className="text-gray-400 text-xs">—</span>
          <input
            type="number"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
            placeholder="To"
            min={1950}
            max={2026}
            className="w-24 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <p className="text-xs text-gray-400">Leave blank to let AI decide</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="shrink-0 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-500">
          <div className="flex gap-1.5 flex-wrap justify-center">
            {["Classifying query...", "Decomposing intent...", "Searching Semantic Scholar..."].map((step, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                {step}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {/* Query understanding card */}
          <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
                    AI understood your query as
                  </p>
                  <p className="text-sm text-gray-800 font-medium">{result.decomposition.intent}</p>
                </div>
              </div>
              <div className="shrink-0">
                {isLookup ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    <Zap className="w-3 h-3" /> Paper Lookup
                  </span>
                ) : isCacheHit ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <Database className="w-3 h-3" /> From Cache
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                    <Sparkles className="w-3 h-3" /> Topic Search
                  </span>
                )}
              </div>
            </div>

            {result.decomposition.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {result.decomposition.keywords.map((k) => (
                  <span key={k} className="px-2 py-0.5 bg-white border border-orange-200 text-orange-700 rounded text-xs font-medium">
                    {k}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-4 mt-3 text-xs text-gray-500 flex-wrap">
              {result.decomposition.venues.length > 0 && (
                <span>Venues: <strong>{result.decomposition.venues.join(", ")}</strong></span>
              )}
              {result.decomposition.yearRange?.from && (
                <span>Years: <strong>{result.decomposition.yearRange.from}–{result.decomposition.yearRange.to ?? "now"}</strong></span>
              )}
              <span>Found: <strong>{result.results.total} papers</strong></span>
              {result.metadata.hasSemanticReranking && (
                <span className="text-orange-600 font-medium">+ vector similarity</span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200 shrink-0">
            {[
              { key: "papers", label: `By Conference (${result.results.total})` },
              ...(result.results.semanticMatches?.length > 0
                ? [{ key: "semantic", label: `Semantic Matches (${result.results.semanticMatches.length})` }]
                : []),
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as "papers" | "semantic")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Papers by conference */}
          {activeTab === "papers" && (
            <div className="space-y-3">
              {Object.entries(result.results.byConference).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  No papers found — try rephrasing or adjusting the year range
                </p>
              ) : Object.entries(result.results.byConference).map(([conf, papers]) => (
                <div key={conf} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedConf(expandedConf === conf ? null : conf)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-sm text-gray-900">{conf}</span>
                      <span className="text-xs text-gray-500">{papers.length} papers</span>
                    </div>
                    {expandedConf === conf
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>

                  {expandedConf === conf && (
                    <div className="divide-y divide-gray-100">
                      {papers.slice(0, 10).map((paper) => {
                        const url = getPaperUrl(paper);
                        const isAdded = addedPapers.has(paper.id);
                        const isAdding = addingPapers.has(paper.id);
                        return (
                          <div key={paper.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{paper.title}</p>
                                  {url && (
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-gray-400 hover:text-orange-500">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {parseAuthors(paper.authors)}
                                  {paper.year ? ` · ${paper.year}` : ""}
                                  {paper.venue ? ` · ${paper.venue}` : ""}
                                </p>
                                {paper.tldr ? (
                                  <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">"{paper.tldr}"</p>
                                ) : paper.abstract ? (
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{paper.abstract}</p>
                                ) : null}
                              </div>
                              <div className="shrink-0 flex items-center gap-1.5">
                                {paper.citationCount != null && paper.citationCount > 0 && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                                    {paper.citationCount.toLocaleString()} cit.
                                  </span>
                                )}
                                <button
                                  onClick={() => addToLibrary(paper)}
                                  disabled={isAdded || isAdding}
                                  title={isAdded ? "Added to library" : "Add to library"}
                                  className={`p-1 rounded transition-colors ${
                                    isAdded
                                      ? "text-green-500 cursor-default"
                                      : "text-gray-300 hover:text-orange-500 hover:bg-orange-50"
                                  }`}
                                >
                                  {isAdded ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {papers.length > 10 && (
                        <p className="px-4 py-2 text-xs text-gray-400 text-center">
                          + {papers.length - 10} more papers
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Semantic matches */}
          {activeTab === "semantic" && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Papers from your cached index ranked by vector similarity to this query</p>
              {result.results.semanticMatches?.map((paper) => {
                const url = getPaperUrl(paper);
                const isAdded = addedPapers.has(paper.id);
                const isAdding = addingPapers.has(paper.id);
                return (
                  <div key={paper.id} className="p-3 border border-gray-200 rounded-lg hover:border-orange-200 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 text-center">
                        <span className="text-sm font-bold text-orange-600">{Math.round(paper.similarity * 100)}%</span>
                        <p className="text-xs text-gray-400">match</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{paper.title}</p>
                          {url && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-gray-400 hover:text-orange-500">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {parseAuthors(paper.authors)}
                          {paper.venue ? ` · ${paper.venue}` : ""}
                          {paper.year ? ` · ${paper.year}` : ""}
                        </p>
                        {paper.abstract && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{paper.abstract}</p>
                        )}
                      </div>
                      <button
                        onClick={() => addToLibrary(paper)}
                        disabled={isAdded || isAdding}
                        title={isAdded ? "Added to library" : "Add to library"}
                        className={`shrink-0 p-1 rounded transition-colors ${
                          isAdded
                            ? "text-green-500 cursor-default"
                            : "text-gray-300 hover:text-orange-500 hover:bg-orange-50"
                        }`}
                      >
                        {isAdded ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center text-gray-400 py-8">
          <Sparkles className="w-10 h-10 text-orange-200" />
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-500">Two search modes, automatically selected</p>
            <div className="flex gap-3 justify-center text-xs">
              <div className="px-3 py-2 bg-blue-50 rounded-lg text-blue-700 max-w-40">
                <div className="flex items-center gap-1 font-semibold mb-1"><Zap className="w-3 h-3" /> Paper Lookup</div>
                <p className="text-blue-500">Short query = direct title search, instant results</p>
              </div>
              <div className="px-3 py-2 bg-orange-50 rounded-lg text-orange-700 max-w-40">
                <div className="flex items-center gap-1 font-semibold mb-1"><Sparkles className="w-3 h-3" /> Topic Search</div>
                <p className="text-orange-500">Longer query = AI decomposes intent, searches conferences</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContent>
  );

  if (!showTrigger) {
    return <Dialog open={open} onOpenChange={setOpen}>{dialogContent}</Dialog>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          AI Search
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
