import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SummaryEditor } from "./summary-editor";
import { ProcessingPanel } from "./processing-panel";
import { BibTeXDisplay } from "./bibtex-display";
import { AbstractCard } from "./abstract-card";
import { PDFDownloadCard } from "./pdf-download-card";
import { CitationsSection } from "./citations-section";
import { DeletePaperButton } from "./delete-paper-button";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PaperDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const search = await searchParams;
  const fromPath = typeof search.from === 'string' ? search.from : '/library';
  const paper = await db.paper.findUnique({
    where: { id },
    include: {
      citations: {
        orderBy: [{ year: "desc" }, { title: "asc" }],
      },
    },
  });

  if (!paper) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PROCESSING: "bg-primary-100 text-primary-700",
      READY: "bg-green-100 text-green-700",
      FAILED: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700"}`}
      >
        {status}
      </span>
    );
  };

  // Determine back button text and destination
  const getBackButtonInfo = () => {
    if (fromPath.startsWith('/projects/')) {
      return { href: fromPath, text: 'Back to Project' };
    }
    return { href: '/library', text: 'Back to Library' };
  };
  
  const backButton = getBackButtonInfo();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <Link
            href={backButton.href}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backButton.text}
          </Link>
        </div>

        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 break-words">
                  {paper.title || "Untitled (processing)"}
                </h1>
                {getStatusBadge(paper.status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                  {paper.venueType.replace(/_/g, " ")}
                </span>
              </div>
            </div>
            <DeletePaperButton paperId={paper.id} paperTitle={paper.title} />
          </div>
        </div>

        {/* Processing Status Panel */}
        <ProcessingPanel
          paperId={paper.id}
          status={paper.status}
          lastError={paper.lastProcessingError}
          processedAt={paper.processedAt}
          attempts={paper.processingAttempts}
          venueMismatchNote={paper.venueMismatchNote}
          detectedVenueType={paper.detectedVenueType}
        />

        {/* Main Content Grid: Abstract (2/3) + Metadata+PDF (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Abstract (prominent) */}
          <div className="lg:col-span-2">
            <AbstractCard abstract={paper.abstract} />
          </div>

          {/* Right column - Metadata & PDF Download */}
          <div className="space-y-6">
            {/* Metadata */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Metadata
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Authors</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {paper.authors || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Year</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {paper.year || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">DOI</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {paper.doi || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    arXiv ID
                  </dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {paper.arxivId || "—"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* PDF Download (compact) */}
            <PDFDownloadCard
              paperId={paper.id}
              fileName={paper.originalFileName}
            />
          </div>
        </div>

        {/* BibTeX, Citations, and Summary */}
        <div className="grid grid-cols-1 gap-6 mt-6">
          <BibTeXDisplay bibtex={paper.bibtex} />
          <CitationsSection
            paperId={paper.id}
            citations={paper.citations}
            status={paper.citationsStatus}
            error={paper.citationsError}
            count={paper.citationsCount}
            scannedPages={paper.citationsScannedPages}
          />
          <SummaryEditor paperId={paper.id} initialSummary={paper.summary} />
        </div>
      </div>
    </div>
  );
}
