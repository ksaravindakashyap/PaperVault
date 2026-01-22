import { VenueType } from "@prisma/client";

export interface BibTeXInput {
  paperId: string;
  title?: string;
  authors?: string;
  year?: number;
  venueType: VenueType;
  doi?: string;
  arxivId?: string;
}

const CONFERENCE_VENUES = [
  "ACL",
  "NEURIPS",
  "ICML",
  "ICLR",
  "EMNLP",
  "NAACL",
  "USENIX_SECURITY",
  "CCS",
  "NDSS",
  "CHI",
];

export function generateBibTeX(input: BibTeXInput): string {
  const entryType = CONFERENCE_VENUES.includes(input.venueType)
    ? "inproceedings"
    : "article";

  // Generate citation key
  const citationKey = generateCitationKey(input);

  // Build BibTeX entry
  let bibtex = `@${entryType}{${citationKey},\n`;

  if (input.title) {
    bibtex += `  title = {${escapeBibTeX(input.title)}},\n`;
  }

  if (input.authors) {
    bibtex += `  author = {${escapeBibTeX(input.authors)}},\n`;
  }

  if (input.year) {
    bibtex += `  year = {${input.year}},\n`;
  }

  // Add venue-specific fields
  const venueName = getVenueName(input.venueType);
  if (venueName) {
    if (entryType === "inproceedings") {
      bibtex += `  booktitle = {${venueName}},\n`;
    } else {
      bibtex += `  journal = {${venueName}},\n`;
    }
  }

  if (input.doi) {
    bibtex += `  doi = {${input.doi}},\n`;
  }

  if (input.arxivId) {
    bibtex += `  archivePrefix = {arXiv},\n`;
    bibtex += `  eprint = {${input.arxivId}},\n`;
  }

  // Add note about PaperVault
  bibtex += `  note = {Imported via PaperVault}\n`;

  bibtex += `}`;

  return bibtex;
}

function generateCitationKey(input: BibTeXInput): string {
  // Try to extract first author last name
  let authorPart = "unknown";
  if (input.authors) {
    const firstAuthor = input.authors.split(",")[0].trim();
    const words = firstAuthor.split(/\s+/);
    // Assume last word is last name
    if (words.length > 0) {
      authorPart = words[words.length - 1]
        .toLowerCase()
        .replace(/[^a-z]/g, "");
    }
  }

  // Year part
  const yearPart = input.year ? input.year.toString() : "xxxx";

  // Title token
  let titleToken = "";
  if (input.title) {
    const words = input.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !/^(the|and|for|with)$/.test(w));
    if (words.length > 0) {
      titleToken = words[0].replace(/[^a-z]/g, "").substring(0, 8);
    }
  }

  if (!titleToken) {
    titleToken = input.paperId.substring(0, 8);
  }

  return `${authorPart}${yearPart}${titleToken}`;
}

function getVenueName(venueType: VenueType): string | undefined {
  const venueNames: Partial<Record<VenueType, string>> = {
    ACL: "Proceedings of the Annual Meeting of the Association for Computational Linguistics",
    EMNLP: "Proceedings of the Conference on Empirical Methods in Natural Language Processing",
    NAACL: "Proceedings of the North American Chapter of the Association for Computational Linguistics",
    NEURIPS: "Advances in Neural Information Processing Systems",
    ICML: "International Conference on Machine Learning",
    ICLR: "International Conference on Learning Representations",
    USENIX_SECURITY: "USENIX Security Symposium",
    CCS: "ACM Conference on Computer and Communications Security",
    NDSS: "Network and Distributed System Security Symposium",
    CHI: "ACM Conference on Human Factors in Computing Systems",
    IEEE_GENERIC: "IEEE Conference Proceedings",
  };

  return venueNames[venueType];
}

function escapeBibTeX(text: string): string {
  return (
    text
      // Escape special BibTeX characters
      .replace(/\\/g, "\\textbackslash{}")
      .replace(/[{}]/g, "")
      .replace(/%/g, "\\%")
      .replace(/&/g, "\\&")
      .replace(/#/g, "\\#")
      .replace(/_/g, "\\_")
      // Remove excessive whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}
