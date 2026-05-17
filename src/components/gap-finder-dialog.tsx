"use client";

import { useState } from "react";
import { Telescope, ExternalLink, BookmarkPlus, Check, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GapPaperResult {
  title: string;
  year: number | null;
  venue: string | null;
  arxivId: string | null;
  doi: string | null;
  s2Id: string | null;
  abstract: string | null;
}

interface Gap {
  title: string;
  description: string;
  papers: GapPaperResult[];
}

export function GapFinderDialog() {
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [meta, setMeta] = useState<{ libraryPapersUsed: number; externalPapersUsed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedPapers, setAddedPapers] = useState<Set<string>>(new Set());
  const [addingPapers, setAddingPapers] = useState<Set<string>>(new Set());

  const handleFind = async () => {
    if (!focus.trim() || focus.trim().length < 10) return;
    setLoading(true);
    setGaps([]);
    setError(null);
    setMeta(null);

    try {
      const res = await fetch("/api/papers/gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus: focus.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gap analysis failed");
      setGaps(data.gaps ?? []);
      setMeta({ libraryPapersUsed: data.libraryPapersUsed, externalPapersUsed: data.externalPapersUsed });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLibrary = async (paper: GapPaperResult) => {
    const key = paper.s2Id ?? paper.title;
    if (addedPapers.has(key) || addingPapers.has(key)) return;

    setAddingPapers((prev) => new Set(prev).add(key));
    try {
      // Find or create the ExternalPaper record first
      let externalPaperId: string | null = null;

      if (paper.s2Id) {
        const epRes = await fetch(`/api/external-papers/find?s2Id=${encodeURIComponent(paper.s2Id)}`);
        if (epRes.ok) {
          const ep = await epRes.json();
          externalPaperId = ep.id ?? null;
        }
      }

      if (!externalPaperId) {
        setAddingPapers((prev) => { const n = new Set(prev); n.delete(key); return n; });
        return;
      }

      const res = await fetch("/api/library/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalPaperId }),
      });

      if (res.ok) {
        setAddedPapers((prev) => new Set(prev).add(key));
      }
    } catch { /* non-critical */ }
    finally {
      setAddingPapers((prev) => { const n = new Set(prev); n.delete(key); return n; });
    }
  };

  const paperUrl = (p: GapPaperResult) => {
    if (p.arxivId) return `https://arxiv.org/abs/${p.arxivId}`;
    if (p.doi) return `https://doi.org/${p.doi}`;
    if (p.s2Id) return `https://www.semanticscholar.org/paper/${p.s2Id}`;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setGaps([]); setError(null); setMeta(null); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Telescope className="w-4 h-4" /> Find Gaps
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Telescope className="w-5 h-5 text-indigo-500" /> Research Gap Finder
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-500 -mt-2">
          Describe your research direction. AI will compare your library against recent literature and surface what you&apos;re missing.
        </p>

        {/* Input */}
        <div className="space-y-2">
          <textarea
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. I'm studying efficient transformer architectures for low-resource NLP tasks…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900 placeholder-gray-400"
            rows={3}
          />
          <button
            onClick={handleFind}
            disabled={loading || focus.trim().length < 10}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? "Analyzing…" : "Find Research Gaps"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Comparing your library against recent literature…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {gaps.length > 0 && (
          <div className="space-y-4">
            {meta && (
              <p className="text-xs text-gray-400">
                Analysed {meta.libraryPapersUsed} library papers · {meta.externalPapersUsed} recent external papers
              </p>
            )}
            {gaps.map((gap, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-gray-900 text-sm">{gap.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3 pl-7">{gap.description}</p>

                {gap.papers.length > 0 && (
                  <div className="pl-7 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Suggested papers</p>
                    {gap.papers.map((paper, j) => {
                      const key = paper.s2Id ?? paper.title;
                      const url = paperUrl(paper);
                      const isAdded = addedPapers.has(key);
                      const isAdding = addingPapers.has(key);
                      return (
                        <div key={j} className="flex items-start gap-2 bg-gray-50 rounded-lg p-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{paper.title}</p>
                            <p className="text-xs text-gray-500">
                              {[paper.venue, paper.year].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {url && (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                                title="Open paper"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {paper.s2Id && (
                              <button
                                onClick={() => handleAddToLibrary(paper)}
                                disabled={isAdded || isAdding}
                                title={isAdded ? "Added to library" : "Add to library"}
                                className="p-1.5 rounded text-gray-400 hover:text-indigo-600 disabled:opacity-50 transition-colors"
                              >
                                {isAdded ? <Check className="w-3.5 h-3.5 text-green-600" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
