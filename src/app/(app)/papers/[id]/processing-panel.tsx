"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ProcessingPanelProps {
  paperId: string;
  status: string;
  lastError: string | null;
  processedAt: Date | null;
  attempts: number;
  venueMismatchNote: string | null;
  detectedVenueType: string | null;
}

export function ProcessingPanel({
  paperId,
  status,
  lastError,
  processedAt,
  attempts,
  venueMismatchNote,
  detectedVenueType,
}: ProcessingPanelProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formattedDate, setFormattedDate] = useState<string>("");

  // Format date on client side only to avoid hydration mismatch
  useEffect(() => {
    if (processedAt) {
      setFormattedDate(new Date(processedAt).toLocaleString());
    }
  }, [processedAt]);

  const handleReprocess = async (useDetected: boolean = false) => {
    setIsProcessing(true);
    try {
      let url = `/api/papers/${paperId}/process`;
      const params = new URLSearchParams();
      if (status === "READY") params.append("force", "1");
      if (useDetected) params.append("useDetected", "1");
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, { method: "POST" });
      const data = await response.json();

      if (response.ok) {
        router.refresh();
      } else {
        alert(`Processing failed: ${data.message || data.error}`);
      }
    } catch {
      alert("Failed to trigger processing");
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === "READY") {
    return (
      <>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-green-900">
                ✓ Metadata Extracted
              </h3>
              {formattedDate && (
                <p className="text-xs text-green-700 mt-1">
                  Processed at {formattedDate}
                </p>
              )}
            </div>
            <button
              onClick={() => handleReprocess(false)}
              disabled={isProcessing}
              className="text-sm text-green-700 hover:text-green-900 font-medium disabled:opacity-50"
            >
              {isProcessing ? "Reprocessing..." : "Reprocess"}
            </button>
          </div>
        </div>
        {venueMismatchNote && detectedVenueType && (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-orange-900 mb-2">
                  ⚠️ Venue Mismatch Detected
                </h3>
                <p className="text-xs text-orange-800 mb-3">
                  {venueMismatchNote}
                </p>
              </div>
              <button
                onClick={() => handleReprocess(true)}
                disabled={isProcessing}
                className="ml-4 px-3 py-1.5 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 font-medium disabled:opacity-50 whitespace-nowrap"
              >
                {isProcessing
                  ? "Reprocessing..."
                  : `Use ${detectedVenueType} Profile`}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (status === "FAILED") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900">
              ✗ Processing Failed
            </h3>
            {lastError && (
              <p className="text-xs text-red-700 mt-2 font-mono">
                {lastError}
              </p>
            )}
            <p className="text-xs text-red-600 mt-2">
              Attempts: {attempts} / 5
            </p>
          </div>
          <button
            onClick={() => handleReprocess(false)}
            disabled={isProcessing}
            className="text-sm text-red-700 hover:text-red-900 font-medium disabled:opacity-50 ml-4"
          >
            {isProcessing ? "Retrying..." : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  // PROCESSING
  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full"></div>
            <h3 className="text-sm font-semibold text-primary-900">
              Processing Metadata...
            </h3>
          </div>
          <p className="text-xs text-primary-700 mt-2">
            Run <code className="bg-primary-100 px-1 py-0.5 rounded">npm run worker</code> to
            process, or click the button to process now.
          </p>
          {lastError && (
            <p className="text-xs text-red-600 mt-2 font-mono">{lastError}</p>
          )}
          <p className="text-xs text-primary-600 mt-1">
            Attempts: {attempts} / 5
          </p>
        </div>
        <button
          onClick={() => handleReprocess(false)}
          disabled={isProcessing}
          className="text-sm text-primary-700 hover:text-primary-900 font-medium disabled:opacity-50 ml-4"
        >
          {isProcessing ? "Processing..." : "Process Now"}
        </button>
      </div>
    </div>
  );
}
