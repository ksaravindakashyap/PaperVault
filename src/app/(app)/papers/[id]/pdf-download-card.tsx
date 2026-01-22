interface PDFDownloadCardProps {
  paperId: string;
  fileName: string;
}

export function PDFDownloadCard({ paperId, fileName }: PDFDownloadCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        PDF Document
      </h2>
      
      <div className="space-y-3">
        <div className="text-sm text-gray-700">
          <p className="font-medium truncate" title={fileName}>
            {fileName}
          </p>
        </div>

        <a
          href={`/api/papers/${paperId}/download`}
          download
          className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 font-medium text-sm transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download PDF
        </a>

        <p className="text-xs text-gray-500 text-center">
          Full PDF viewer coming in future steps
        </p>
      </div>
    </div>
  );
}
