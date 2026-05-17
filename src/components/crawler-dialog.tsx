"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface CrawlerStats {
  recentImports: number;
  cachedExternal: number;
  byVenue: Array<{ venue: string; count: number }>;
}

interface CrawlResults {
  arxiv: {
    imported: number;
    skipped: number;
    errors: number;
  } | null;
  semanticScholar: {
    imported: number;
    skipped: number;
    errors: number;
    cached: number;
  } | null;
  totalImported: number;
  totalSkipped: number;
  totalErrors: number;
}

export default function CrawlerDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CrawlerStats | null>(null);
  const [results, setResults] = useState<CrawlResults | null>(null);
  
  const [source, setSource] = useState<"arxiv" | "semantic" | "both">("both");
  const [conferences, setConferences] = useState([
    "NEURIPS",
    "ICML",
    "ICLR",
    "ACL",
    "EMNLP",
  ]);
  const [yearFrom, setYearFrom] = useState(new Date().getFullYear() - 2);
  const [yearTo, setYearTo] = useState(new Date().getFullYear());
  const [maxPapers, setMaxPapers] = useState(50);
  
  const loadStats = async () => {
    try {
      const response = await fetch("/api/crawler");
      if (!response.ok) throw new Error("Failed to load stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };
  
  const startCrawl = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      const response = await fetch("/api/crawler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          conferences,
          yearFrom,
          yearTo,
          maxPapersPerConference: maxPapers,
        }),
      });
      
      if (!response.ok) throw new Error("Crawl failed");
      
      const data = await response.json();
      setResults(data);
      
      // Reload stats
      await loadStats();
      
    } catch (error) {
      console.error("Error starting crawl:", error);
      alert("Crawl failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
          loadStats();
        }}
        variant="outline"
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Import Papers
      </Button>
      
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">Import Papers</h2>
                <p className="text-gray-600 mt-1">
                  Automatically import papers from arXiv and Semantic Scholar
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Stats */}
            {stats && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">Current Stats</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Recent Imports</div>
                    <div className="text-2xl font-bold">{stats.recentImports}</div>
                    <div className="text-xs text-gray-500">Last 7 days</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Cached Papers</div>
                    <div className="text-2xl font-bold">{stats.cachedExternal}</div>
                    <div className="text-xs text-gray-500">From searches</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Conferences</div>
                    <div className="text-2xl font-bold">{stats.byVenue.length}</div>
                    <div className="text-xs text-gray-500">Total venues</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Configuration */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Data Source
                </label>
                <select
                  value={source}
                  onChange={e => setSource(e.target.value as "arxiv" | "semantic" | "both")}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="both">Both (arXiv + Semantic Scholar)</option>
                  <option value="arxiv">arXiv only</option>
                  <option value="semantic">Semantic Scholar only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Conferences (comma-separated)
                </label>
                <input
                  type="text"
                  value={conferences.join(", ")}
                  onChange={e => setConferences(e.target.value.split(",").map(s => s.trim()))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="NEURIPS, ICML, ICLR..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: NEURIPS, ICML, ICLR, ACL, EMNLP, NAACL, USENIX_SECURITY, CCS, NDSS, CHI
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Year From
                  </label>
                  <input
                    type="number"
                    value={yearFrom}
                    onChange={e => setYearFrom(parseInt(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Year To
                  </label>
                  <input
                    type="number"
                    value={yearTo}
                    onChange={e => setYearTo(parseInt(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Max Per Conf
                  </label>
                  <input
                    type="number"
                    value={maxPapers}
                    onChange={e => setMaxPapers(parseInt(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
            
            {/* Results */}
            {results && (
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">Crawl Results</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Imported:</span>
                    <span className="font-bold text-green-700">
                      {results.totalImported}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Skipped (duplicates):</span>
                    <span className="text-gray-600">{results.totalSkipped}</span>
                  </div>
                  {results.semanticScholar && (
                    <div className="flex justify-between">
                      <span>Cached for search:</span>
                      <span className="text-gray-600">
                        {results.semanticScholar.cached}
                      </span>
                    </div>
                  )}
                  {results.totalErrors > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Errors:</span>
                      <span className="font-bold">{results.totalErrors}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Action */}
            <div className="flex gap-3">
              <Button
                onClick={startCrawl}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Crawling...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Start Crawl
                  </>
                )}
              </Button>
              <Button
                onClick={() => setOpen(false)}
                variant="outline"
                disabled={loading}
              >
                Close
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              Note: Large crawls may take several minutes. Papers will be processed in the background.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
