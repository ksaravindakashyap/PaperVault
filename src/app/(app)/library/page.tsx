"use client";

import { useState, useEffect, useMemo } from "react";
import { UploadPaperModal } from "@/components/upload-paper-modal";
import CrawlerDialog from "@/components/crawler-dialog";
import { GapFinderDialog } from "@/components/gap-finder-dialog";
import Link from "next/link";
import { Trash2, Search, SlidersHorizontal, ExternalLink, LayoutList, Columns3, ChevronRight, ChevronLeft, Sparkles, Copy, Check, X, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Paper {
  id: string;
  title: string | null;
  authors: string | null;
  year: number | null;
  venueType: string;
  status: string;
  createdAt: string;
  originalFileName: string;
  fileKey: string;
  arxivId: string | null;
  doi: string | null;
}

const VENUE_LABELS: Record<string, string> = {
  ACL: "ACL", NEURIPS: "NeurIPS", ICML: "ICML", ICLR: "ICLR",
  EMNLP: "EMNLP", NAACL: "NAACL", USENIX_SECURITY: "USENIX Security",
  CCS: "CCS", NDSS: "NDSS", CHI: "CHI", IEEE_GENERIC: "IEEE", OTHER: "Other",
};

const COLUMNS = [
  { status: "READY",      label: "Inbox",      dot: "bg-gray-400",   header: "text-gray-700",   bg: "bg-gray-50",    border: "border-gray-200" },
  { status: "TO_READ",    label: "To Read",    dot: "bg-blue-400",   header: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-100" },
  { status: "SKIMMED",    label: "Skimmed",    dot: "bg-purple-400", header: "text-purple-700", bg: "bg-purple-50",  border: "border-purple-100" },
  { status: "DEEP_READ",  label: "Deep Read",  dot: "bg-indigo-400", header: "text-indigo-700", bg: "bg-indigo-50",  border: "border-indigo-100" },
  { status: "INTEGRATED", label: "Integrated", dot: "bg-teal-400",   header: "text-teal-700",   bg: "bg-teal-50",    border: "border-teal-100" },
] as const;

const STATUS_ORDER = COLUMNS.map((c) => c.status);

function firstAuthor(authors: string | null): string | null {
  if (!authors) return null;
  try {
    const arr = JSON.parse(authors);
    if (Array.isArray(arr)) return arr[0]?.name ?? null;
  } catch { /* plain string */ }
  return authors.split(",")[0].trim() || null;
}

export default function LibraryPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [view, setView] = useState<"list" | "board">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPaper, setProcessingPaper] = useState<string | null>(null);
  const [deletingPaper, setDeletingPaper] = useState<string | null>(null);
  const [paperToDelete, setPaperToDelete] = useState<Paper | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [venueFilter, setVenueFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Recommendations
  interface Recommendation {
    id: string;
    title: string | null;
    authors: string | null;
    year: number | null;
    venueType: string;
    fileKey: string;
    arxivId: string | null;
    doi: string | null;
    similarity: number | null;
  }
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recoSource, setRecoSource] = useState<"deep_reads" | "skimmed" | "none">("none");
  const [recoSignalCount, setRecoSignalCount] = useState(0);
  const [recoFallback, setRecoFallback] = useState(false);
  const [recoLoading, setRecoLoading] = useState(false);

  // Selection + synthesis
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [synthesisOpen, setSynthesisOpen] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState<{ synthesis: string; papers: { id: string; title: string }[] } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadPapers = async () => {
    try {
      const res = await fetch("/api/papers");
      if (res.ok) setPapers(await res.json());
    } catch (e) {
      console.error("Failed to load papers:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadPapers(); }, []);

  const loadRecommendations = async () => {
    setRecoLoading(true);
    try {
      const res = await fetch("/api/papers/recommendations");
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations ?? []);
        setRecoSource(data.signalSource ?? "none");
        setRecoSignalCount(data.signalCount ?? 0);
        setRecoFallback(data.fallback ?? false);
      }
    } catch { /* non-critical */ }
    finally { setRecoLoading(false); }
  };

  useEffect(() => {
    if (view === "board") loadRecommendations();
  }, [view]);

  // Optimistic status update — updates UI immediately, reverts on API failure
  const handleStatusChange = async (paperId: string, newStatus: string) => {
    setPapers((prev) => prev.map((p) => p.id === paperId ? { ...p, status: newStatus } : p));
    try {
      const res = await fetch(`/api/papers/${paperId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) loadPapers(); // revert
    } catch {
      loadPapers();
    }
  };

  const filteredPapers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return papers.filter((p) => {
      if (venueFilter !== "all" && p.venueType !== venueFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      const title = (p.title || p.originalFileName).toLowerCase();
      const authors = (p.authors || "").toLowerCase();
      return title.includes(q) || authors.includes(q);
    });
  }, [papers, searchQuery, venueFilter, statusFilter]);

  const handleModalClose = () => { setIsModalOpen(false); loadPapers(); };

  const handleReprocess = async (paperId: string, force = false) => {
    setProcessingPaper(paperId);
    try {
      const url = force ? `/api/papers/${paperId}/process?force=1` : `/api/papers/${paperId}/process`;
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (res.ok) { alert("Processing completed!"); loadPapers(); }
      else alert(`Processing failed: ${data.message || data.error}`);
    } catch { alert("Failed to trigger processing"); }
    finally { setProcessingPaper(null); }
  };

  const handleDeleteClick = (paper: Paper) => setPaperToDelete(paper);

  const handleDeleteConfirm = async () => {
    if (!paperToDelete) return;
    setDeletingPaper(paperToDelete.id);
    try {
      const res = await fetch(`/api/papers/${paperToDelete.id}`, { method: "DELETE" });
      if (res.ok) loadPapers();
      else { const d = await res.json(); alert(`Delete failed: ${d.error || "Unknown error"}`); }
    } catch { alert("Failed to delete paper"); }
    finally { setDeletingPaper(null); setPaperToDelete(null); }
  };

  const handleSynthesize = async () => {
    setSynthesisResult(null);
    setSynthesizing(true);
    setSynthesisOpen(true);
    try {
      const res = await fetch("/api/papers/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Synthesis failed");
      setSynthesisResult(data);
    } catch (err) {
      setSynthesisResult({ synthesis: `Error: ${err instanceof Error ? err.message : "Failed to synthesize"}`, papers: [] });
    } finally {
      setSynthesizing(false);
    }
  };

  const handleCopy = () => {
    if (!synthesisResult?.synthesis) return;
    navigator.clipboard.writeText(synthesisResult.synthesis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPapers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPapers.map((p) => p.id)));
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PROCESSING: "bg-yellow-100 text-yellow-700", READY: "bg-green-100 text-green-700",
      FAILED: "bg-red-100 text-red-700", TO_READ: "bg-blue-100 text-blue-700",
      SKIMMED: "bg-purple-100 text-purple-700", DEEP_READ: "bg-indigo-100 text-indigo-700",
      INTEGRATED: "bg-teal-100 text-teal-700",
    };
    const label: Record<string, string> = {
      PROCESSING: "Processing", READY: "Ready", FAILED: "Failed",
      TO_READ: "To Read", SKIMMED: "Skimmed", DEEP_READ: "Deep Read", INTEGRATED: "Integrated",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {label[status] || status}
      </span>
    );
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const uniqueVenues = [...new Set(papers.map((p) => p.venueType))];

  // Papers visible in the board (exclude PROCESSING/FAILED)
  const boardPapers = papers.filter((p) => STATUS_ORDER.includes(p.status as typeof STATUS_ORDER[number]));

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Library</h1>
            <p className="text-sm text-gray-500 mt-1">
              {papers.length} paper{papers.length !== 1 ? "s" : ""} indexed
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* List / Board toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setView("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <LayoutList className="w-4 h-4" /> List
              </button>
              <button
                onClick={() => setView("board")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === "board" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Columns3 className="w-4 h-4" /> Reading Queue
              </button>
            </div>
            <GapFinderDialog />
            <CrawlerDialog />
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 font-medium"
            >
              Upload Paper
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : view === "board" ? (

          /* ── KANBAN BOARD ── */
          <div>
            {/* Recommendations panel — always visible in board view */}
            <div className="mb-5 bg-white rounded-xl border border-orange-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-semibold text-gray-800">What to read next</h3>
                {!recoLoading && !recoFallback && recoSource !== "none" && (
                  <span className="text-xs text-gray-400">
                    · based on your {recoSignalCount} {recoSource === "deep_reads" ? "deeply read" : "skimmed"} paper{recoSignalCount !== 1 ? "s" : ""}
                  </span>
                )}
                {!recoLoading && recoFallback && (
                  <span className="text-xs text-gray-400">· recently added</span>
                )}
              </div>

              {recoLoading ? (
                <div className="flex gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex-1 h-20 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : recommendations.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {recommendations.map((rec) => {
                    const fa = firstAuthor(rec.authors);
                    const meta = [fa, rec.year].filter(Boolean).join(" · ");
                    const pct = rec.similarity !== null ? Math.round(rec.similarity * 100) : null;
                    return (
                      <Link
                        key={rec.id}
                        href={`/papers/${rec.id}?from=/library`}
                        className="flex-shrink-0 w-56 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg p-3 transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-1">
                          {rec.title ?? "Untitled"}
                        </p>
                        {meta && <p className="text-xs text-gray-500 mb-2">{meta}</p>}
                        {rec.similarity !== null && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-orange-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange-400 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-orange-600 font-medium">{pct}%</span>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  {recoSource === "none"
                    ? "Move papers to Deep Read or Skimmed — recommendations will appear once you've read a few."
                    : "No To Read papers have been indexed yet. Add papers via AI Search to get suggestions."}
                </p>
              )}
            </div>

            {boardPapers.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500 mb-2">No papers in your reading queue yet</p>
                <p className="text-sm text-gray-400">Upload papers or use AI Search to add them to your library</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 items-start">
                {COLUMNS.map((col) => {
                  const colPapers = boardPapers.filter((p) => p.status === col.status);
                  const colIdx = STATUS_ORDER.indexOf(col.status);
                  return (
                    <div key={col.status} className={`flex-shrink-0 w-72 rounded-xl border ${col.border} ${col.bg} p-3`}>
                      {/* Column header */}
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                        <h3 className={`text-sm font-semibold ${col.header}`}>{col.label}</h3>
                        <span className="ml-auto text-xs text-gray-400 font-medium">{colPapers.length}</span>
                      </div>

                      {/* Cards */}
                      <div className="space-y-2">
                        {colPapers.map((paper) => {
                          const fa = firstAuthor(paper.authors);
                          const meta = [fa, paper.year].filter(Boolean).join(" · ");
                          const prev = colIdx > 0 ? STATUS_ORDER[colIdx - 1] : null;
                          const next = colIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[colIdx + 1] : null;

                          return (
                            <div key={paper.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                              <Link
                                href={`/papers/${paper.id}?from=/library`}
                                className="block text-sm font-medium text-gray-900 hover:text-primary line-clamp-2 leading-snug mb-1"
                              >
                                {paper.title || paper.originalFileName}
                              </Link>
                              {meta && <p className="text-xs text-gray-400 mb-2">{meta}</p>}
                              <span className="inline-block text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mb-3">
                                {VENUE_LABELS[paper.venueType] || paper.venueType}
                              </span>

                              {/* Move buttons */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <button
                                  onClick={() => prev && handleStatusChange(paper.id, prev)}
                                  disabled={!prev}
                                  title={prev ? `Move to ${COLUMNS[colIdx - 1]?.label}` : undefined}
                                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 disabled:opacity-0 disabled:pointer-events-none transition-colors"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                  {colIdx > 0 ? COLUMNS[colIdx - 1]?.label : ""}
                                </button>
                                <button
                                  onClick={() => next && handleStatusChange(paper.id, next)}
                                  disabled={!next}
                                  title={next ? `Move to ${COLUMNS[colIdx + 1]?.label}` : undefined}
                                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary font-medium disabled:opacity-0 disabled:pointer-events-none transition-colors"
                                >
                                  {colIdx < COLUMNS.length - 1 ? COLUMNS[colIdx + 1]?.label : ""}
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {colPapers.length === 0 && (
                          <div className="text-center py-6 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
                            No papers here
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        ) : (

          /* ── LIST VIEW ── */
          <>
            {/* Search & Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or author..."
                  className="pl-9"
                />
              </div>
              <div className="flex gap-3 items-center">
                <SlidersHorizontal className="text-gray-400 w-4 h-4 shrink-0" />
                <Select value={venueFilter} onValueChange={setVenueFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All venues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All venues</SelectItem>
                    {uniqueVenues.map((v) => (
                      <SelectItem key={v} value={v}>{VENUE_LABELS[v] || v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="READY">Ready</SelectItem>
                    <SelectItem value="TO_READ">To Read</SelectItem>
                    <SelectItem value="SKIMMED">Skimmed</SelectItem>
                    <SelectItem value="DEEP_READ">Deep Read</SelectItem>
                    <SelectItem value="INTEGRATED">Integrated</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {papers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">No papers yet</p>
                <button onClick={() => setIsModalOpen(true)} className="text-primary hover:text-primary-700 font-medium">
                  Upload your first paper
                </button>
              </div>
            ) : filteredPapers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  No papers match your filters.{" "}
                  <button className="text-primary hover:underline" onClick={() => { setSearchQuery(""); setVenueFilter("all"); setStatusFilter("all"); }}>
                    Clear filters
                  </button>
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                  Showing {filteredPapers.length} of {papers.length} papers
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={filteredPapers.length > 0 && selectedIds.size === filteredPapers.length}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue / Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPapers.map((paper) => (
                      <tr key={paper.id} className={`hover:bg-gray-50 ${selectedIds.has(paper.id) ? "bg-orange-50" : ""}`}>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(paper.id)}
                            onChange={() => toggleSelect(paper.id)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/papers/${paper.id}?from=/library`} className="text-sm font-medium text-gray-900 hover:text-primary line-clamp-2">
                            {paper.title || paper.originalFileName}
                          </Link>
                          {(() => {
                            const fa = firstAuthor(paper.authors);
                            const line = [fa, paper.year].filter(Boolean).join(" · ");
                            return line ? <p className="text-xs text-gray-500 mt-0.5">{line}</p> : null;
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="font-medium">{VENUE_LABELS[paper.venueType] || paper.venueType}</span>
                          {paper.year && <span className="text-gray-400"> · {paper.year}</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(paper.createdAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(paper.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-3">
                            {paper.fileKey.startsWith("external:") ? (
                              (() => {
                                const href = paper.arxivId ? `https://arxiv.org/abs/${paper.arxivId}` : paper.doi ? `https://doi.org/${paper.doi}` : null;
                                return href ? (
                                  <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:text-primary-700 font-medium">
                                    <ExternalLink className="w-3 h-3" /> Open paper
                                  </a>
                                ) : <span className="text-xs text-gray-400">No PDF</span>;
                              })()
                            ) : (
                              <button onClick={() => handleReprocess(paper.id, paper.status === "READY")} disabled={processingPaper === paper.id} className="text-primary hover:text-primary-700 font-medium disabled:opacity-50 text-xs">
                                {processingPaper === paper.id ? "Processing..." : paper.status === "READY" ? "Re-extract" : "Extract"}
                              </button>
                            )}
                            <button onClick={() => handleDeleteClick(paper)} disabled={deletingPaper === paper.id} className="text-red-500 hover:text-red-700 disabled:opacity-50" title="Delete paper">
                              {deletingPaper === paper.id ? <span className="text-xs">...</span> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating selection action bar */}
      {selectedIds.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-full shadow-xl">
          <span className="text-sm font-medium">{selectedIds.size} papers selected</span>
          <button
            onClick={handleSynthesize}
            className="flex items-center gap-2 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-full text-sm font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Synthesize
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Synthesis result dialog */}
      <Dialog open={synthesisOpen} onOpenChange={(open) => { setSynthesisOpen(open); if (!open) setSynthesisResult(null); }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <Sparkles className="w-5 h-5 text-orange-500" /> Literature Synthesis
            </DialogTitle>
          </DialogHeader>

          {synthesisResult && synthesisResult.papers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {synthesisResult.papers.map((p) => (
                <span key={p.id} className="px-2.5 py-1 bg-orange-50 text-orange-800 border border-orange-200 rounded-full text-xs font-medium line-clamp-1 max-w-xs">
                  {p.title}
                </span>
              ))}
            </div>
          )}

          {synthesizing ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Synthesizing {selectedIds.size} papers…</p>
            </div>
          ) : synthesisResult ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{synthesisResult.synthesis}</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {copied ? <><Check className="w-4 h-4 text-green-600" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
                </button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <UploadPaperModal isOpen={isModalOpen} onClose={handleModalClose} />

      <AlertDialog open={!!paperToDelete} onOpenChange={(open) => !open && setPaperToDelete(null)}>
        <AlertDialogContent className="bg-white text-gray-900 border border-gray-200 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Delete Paper?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              This will permanently delete &ldquo;{paperToDelete?.title || paperToDelete?.originalFileName}&rdquo; and all its citations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
