import { batchSearchByVenue, type SemanticScholarPaper } from "@/lib/agentic/semanticScholar";
import type { CrawlerConfig } from "./arxivCrawler";

export async function downloadPdfViaUrl(pdfUrl: string): Promise<Buffer | null> {
  try {
    const response = await fetch(pdfUrl, {
      headers: {
        "User-Agent": "PaperVault/1.0 (Research Management Tool)",
      },
    });
    
    if (!response.ok) return null;
    
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/pdf")) return null;
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Error downloading PDF from ${pdfUrl}:`, error);
    return null;
  }
}

async function tryDownloadPdf(paper: SemanticScholarPaper): Promise<Buffer | null> {
  // Try arXiv first (most reliable)
  if (paper.externalIds?.ArXiv) {
    const arxivId = paper.externalIds.ArXiv;
    const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
    const buffer = await downloadPdfViaUrl(pdfUrl);
    if (buffer) {
      console.log(`Downloaded from arXiv: ${arxivId}`);
      return buffer;
    }
  }
  
  // Try DOI resolver (may redirect to publisher)
  if (paper.externalIds?.DOI) {
    const doi = paper.externalIds.DOI;
    // Some open access papers are available via unpaywall
    const unpaywallUrl = `https://api.unpaywall.org/v2/${doi}?email=papervault@example.com`;
    
    try {
      const unpaywallResp = await fetch(unpaywallUrl);
      if (unpaywallResp.ok) {
        const data = await unpaywallResp.json();
        if (data.best_oa_location?.url_for_pdf) {
          const buffer = await downloadPdfViaUrl(data.best_oa_location.url_for_pdf);
          if (buffer) {
            console.log(`Downloaded from Unpaywall: ${doi}`);
            return buffer;
          }
        }
      }
    } catch {}
  }
  
  console.log(`Could not download PDF for ${paper.title}`);
  return null;
}

export async function crawlSemanticScholar(config: CrawlerConfig): Promise<{ 
  imported: number; 
  skipped: number; 
  errors: number;
  cached: number;
}> {
  const { db } = await import("@/lib/db");
  const { writePdf } = await import("@/lib/storage");
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  let cached = 0;
  
  console.log(`Starting Semantic Scholar crawl for ${config.conferences.length} conferences`);
  
  // Use existing agentic search infrastructure
  const venueResults = await batchSearchByVenue(
    config.conferences, // Use conference names as keywords
    config.conferences,
    config.yearRange
  );
  
  for (const [venue, papers] of venueResults) {
    console.log(`Processing ${papers.length} papers from ${venue}`);
    
    // Filter high-quality papers (citation threshold)
    const highQualityPapers = papers
      .filter(p => p.citationCount >= 10) // At least 10 citations
      .sort((a, b) => b.citationCount - a.citationCount) // Sort by citations
      .slice(0, config.maxPapersPerConference); // Limit per conference
    
    console.log(`Filtered to ${highQualityPapers.length} high-quality papers`);
    
    for (const paper of highQualityPapers) {
      try {
        // Check if already cached in ExternalPaper
        const existingExternal = await db.externalPaper.findUnique({
          where: { semanticScholarId: paper.paperId },
        });
        
        if (!existingExternal) {
          // Cache in ExternalPaper table
          await db.externalPaper.create({
            data: {
              semanticScholarId: paper.paperId,
              arxivId: paper.externalIds?.ArXiv,
              doi: paper.externalIds?.DOI,
              title: paper.title,
              authors: JSON.stringify(paper.authors),
              year: paper.year,
              venue: paper.venue,
              abstract: paper.abstract,
              citationCount: paper.citationCount,
              influentialCitationCount: paper.influentialCitationCount,
              publicationDate: paper.publicationDate,
              s2FieldsOfStudy: JSON.stringify(paper.s2FieldsOfStudy),
              tldr: paper.tldr?.text,
            },
          });
          cached++;
        }
        
        // Check if already imported as Paper
        const existingPaper = await db.paper.findFirst({
          where: {
            OR: [
              paper.externalIds?.ArXiv ? { arxivId: paper.externalIds.ArXiv } : {},
              paper.externalIds?.DOI ? { doi: paper.externalIds.DOI } : {},
            ].filter(obj => Object.keys(obj).length > 0),
          },
        });
        
        if (existingPaper) {
          skipped++;
          continue;
        }
        
        // Try to download PDF
        const pdfBuffer = await tryDownloadPdf(paper);
        
        if (!pdfBuffer) {
          // Can't download PDF, skip for now
          skipped++;
          continue;
        }
        
        // Create paper record
        const newPaper = await db.paper.create({
          data: {
            workspaceId: config.workspaceId,
            originalFileName: `${paper.paperId}.pdf`,
            venueType: venue as "NEURIPS" | "ICML" | "ICLR" | "ACL" | "EMNLP" | "OTHER",
            status: "PROCESSING",
            arxivId: paper.externalIds?.ArXiv,
            doi: paper.externalIds?.DOI,
            title: paper.title,
            authors: paper.authors.map(a => a.name).join(", "),
            abstract: paper.abstract,
            year: paper.year,
            fileKey: "",
          },
        });
        
        // Store PDF
        const fileKey = await writePdf(newPaper.id, pdfBuffer);
        
        // Update with file key
        await db.paper.update({
          where: { id: newPaper.id },
          data: { fileKey },
        });
        
        imported++;
        console.log(`Imported ${paper.title.substring(0, 50)}... (${imported})`);
        
        // Rate limiting: wait 5 seconds between downloads
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        console.error(`Error importing ${paper.title}:`, error);
        errors++;
      }
    }
  }
  
  console.log(`Semantic Scholar crawl complete: ${imported} imported, ${cached} cached, ${skipped} skipped, ${errors} errors`);
  
  return { imported, skipped, errors, cached };
}
