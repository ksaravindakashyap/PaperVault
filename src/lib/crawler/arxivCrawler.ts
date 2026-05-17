export interface CrawlerConfig {
  conferences: string[];
  yearRange: { from: number; to: number };
  maxPapersPerConference: number;
  workspaceId: string;
}

export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedDate: string;
  pdfUrl: string;
  categories: string[];
}

const ARXIV_API_BASE = "http://export.arxiv.org/api/query";

// Conference keywords to search arXiv by
const CONFERENCE_KEYWORDS: Record<string, string[]> = {
  "NEURIPS": ["neurips", "nips"],
  "ICML": ["icml", "international conference on machine learning"],
  "ICLR": ["iclr", "international conference on learning representations"],
  "ACL": ["acl", "association for computational linguistics"],
  "EMNLP": ["emnlp", "empirical methods"],
  "NAACL": ["naacl", "north american chapter"],
  "USENIX_SECURITY": ["usenix security", "security symposium"],
  "CCS": ["ccs", "conference on computer and communications security"],
  "NDSS": ["ndss", "network and distributed system security"],
  "CHI": ["chi", "human factors in computing"],
};

export async function searchArxiv(
  keywords: string[],
  yearRange: { from: number; to: number },
  maxResults: number = 100
): Promise<ArxivPaper[]> {
  // Build search query
  const searchTerms = keywords.map(k => `all:"${k}"`).join(" OR ");
  const query = `search_query=${encodeURIComponent(searchTerms)}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
  
  const url = `${ARXIV_API_BASE}?${query}`;
  
  try {
    const response = await fetch(url);
    const xmlText = await response.text();
    
    // Parse arXiv API XML response
    const papers = parseArxivXML(xmlText, yearRange);
    return papers;
  } catch (error) {
    console.error("ArXiv API error:", error);
    return [];
  }
}

function parseArxivXML(xmlText: string, yearRange: { from: number; to: number }): ArxivPaper[] {
  const papers: ArxivPaper[] = [];
  
  // Simple XML parsing (in production, use a proper XML parser)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  const entries = xmlText.matchAll(entryRegex);
  
  for (const match of entries) {
    const entry = match[1];
    
    // Extract fields
    const idMatch = entry.match(/<id>(.*?)<\/id>/);
    const titleMatch = entry.match(/<title>(.*?)<\/title>/);
    const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/);
    const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
    
    if (!idMatch || !titleMatch || !summaryMatch || !publishedMatch) continue;
    
    const publishedDate = publishedMatch[1];
    const year = new Date(publishedDate).getFullYear();
    
    // Filter by year range
    if (year < yearRange.from || year > yearRange.to) continue;
    
    // Extract authors
    const authorMatches = entry.matchAll(/<name>(.*?)<\/name>/g);
    const authors = Array.from(authorMatches).map(m => m[1].trim());
    
    // Extract categories
    const categoryMatches = entry.matchAll(/<category term="(.*?)"/g);
    const categories = Array.from(categoryMatches).map(m => m[1]);
    
    // Get arXiv ID
    const arxivId = idMatch[1].split("/abs/")[1] || idMatch[1];
    
    papers.push({
      id: arxivId,
      title: titleMatch[1].trim().replace(/\s+/g, " "),
      authors,
      abstract: summaryMatch[1].trim().replace(/\s+/g, " "),
      publishedDate,
      pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
      categories,
    });
  }
  
  return papers;
}

export async function downloadArxivPdf(pdfUrl: string): Promise<Buffer> {
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function crawlArxiv(config: CrawlerConfig): Promise<{ 
  imported: number; 
  skipped: number; 
  errors: number;
}> {
  const { db } = await import("@/lib/db");
  const { writePdf } = await import("@/lib/storage");
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  console.log(`Starting arXiv crawl for ${config.conferences.length} conferences`);
  
  for (const conference of config.conferences) {
    const keywords = CONFERENCE_KEYWORDS[conference] || [conference.toLowerCase()];
    
    console.log(`Searching arXiv for ${conference}...`);
    
    try {
      const papers = await searchArxiv(
        keywords,
        config.yearRange,
        config.maxPapersPerConference
      );
      
      console.log(`Found ${papers.length} papers for ${conference}`);
      
      for (const paper of papers) {
        try {
          // Check if paper already exists by arXiv ID
          const existing = await db.paper.findFirst({
            where: { arxivId: paper.id },
          });
          
          if (existing) {
            skipped++;
            continue;
          }
          
          // Download PDF
          console.log(`Downloading PDF for ${paper.id}...`);
          const pdfBuffer = await downloadArxivPdf(paper.pdfUrl);
          
          // Create paper record
          const newPaper = await db.paper.create({
            data: {
              workspaceId: config.workspaceId,
              originalFileName: `${paper.id}.pdf`,
              venueType: conference as "NEURIPS" | "ICML" | "ICLR" | "ACL" | "EMNLP" | "OTHER",
              status: "PROCESSING",
              arxivId: paper.id,
              title: paper.title,
              authors: paper.authors.join(", "),
              abstract: paper.abstract,
              year: new Date(paper.publishedDate).getFullYear(),
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
          console.log(`Imported ${paper.id} (${imported}/${papers.length})`);
          
          // Rate limiting: wait 3 seconds between downloads
          await new Promise(resolve => setTimeout(resolve, 3000));
          
        } catch (error) {
          console.error(`Error importing ${paper.id}:`, error);
          errors++;
        }
      }
    } catch (error) {
      console.error(`Error crawling ${conference}:`, error);
      errors++;
    }
  }
  
  console.log(`ArXiv crawl complete: ${imported} imported, ${skipped} skipped, ${errors} errors`);
  
  return { imported, skipped, errors };
}
