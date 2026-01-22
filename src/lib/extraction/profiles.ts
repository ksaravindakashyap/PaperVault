import { VenueType } from "@prisma/client";

export type ExtractionProfile = {
  venueTypes: VenueType[];
  abstractRegexes: RegExp[];
  stopRegexes: RegExp[];
  doiRegexes: RegExp[];
  arxivRegexes: RegExp[];
  titleStrategy: "topBlock" | "betweenHeaderAndAbstract" | "heuristic";
  authorStrategy: "betweenTitleAndAbstract" | "heuristic";
  yearStrategy: "copyrightOrHeader" | "heuristic";
};

// ACL-style conferences (ACL, EMNLP, NAACL)
const aclProfile: ExtractionProfile = {
  venueTypes: ["ACL", "EMNLP", "NAACL"],
  abstractRegexes: [
    /\bAbstract\b/i,
    /\bA\s*B\s*S\s*T\s*R\s*A\s*C\s*T\b/i,
  ],
  stopRegexes: [
    /^\s*\d+\.?\s+Introduction\b/im,
    /^\s*1\.?\s+Introduction\b/im,
    /^\s*Introduction\b/im,
    /^\s*Keywords?\b/im,
    /^\s*Index Terms?\b/im,
    /^\s*CCS Concepts?\b/im,
    /^\s*Proceedings of/im,
    /^\s*Copyright/im,
    /^\s*Figure\s+\d+/im,
  ],
  doiRegexes: [
    /10\.\d{4,}\/[^\s]+/g,
  ],
  arxivRegexes: [
    /arXiv:\s*(\d{4}\.\d{4,5})/gi,
    /arxiv\.org\/abs\/(\d{4}\.\d{4,5})/gi,
  ],
  titleStrategy: "topBlock",
  authorStrategy: "betweenTitleAndAbstract",
  yearStrategy: "copyrightOrHeader",
};

// ML conferences (NeurIPS, ICML, ICLR)
const mlProfile: ExtractionProfile = {
  venueTypes: ["NEURIPS", "ICML", "ICLR"],
  abstractRegexes: [
    /\bAbstract\b/i,
    /\bA\s*B\s*S\s*T\s*R\s*A\s*C\s*T\b/i,
  ],
  stopRegexes: [
    /^\s*\d+\.?\s+Introduction\b/im,
    /^\s*1\.?\s+Introduction\b/im,
    /^\s*Introduction\b/im,
    /^\s*\d+\.?\s+Background\b/im,
    /^\s*1\.?\s+Background\b/im,
    /^\s*Keywords?\b/im,
    /^\s*Proceedings of/im,
    /^\s*Copyright/im,
    /^\s*Figure\s+\d+/im,
    /^\s*Table\s+\d+/im,
  ],
  doiRegexes: [
    /10\.\d{4,}\/[^\s]+/g,
  ],
  arxivRegexes: [
    /arXiv:\s*(\d{4}\.\d{4,5})/gi,
    /arxiv\.org\/abs\/(\d{4}\.\d{4,5})/gi,
  ],
  titleStrategy: "topBlock",
  authorStrategy: "betweenTitleAndAbstract",
  yearStrategy: "copyrightOrHeader",
};

// Security conferences (USENIX Security, CCS, NDSS)
const securityProfile: ExtractionProfile = {
  venueTypes: ["USENIX_SECURITY", "CCS", "NDSS"],
  abstractRegexes: [
    /\bAbstract\b/i,
    /\bA\s*B\s*S\s*T\s*R\s*A\s*C\s*T\b/i,
  ],
  stopRegexes: [
    /^\s*\d+\.?\s+Introduction\b/im,
    /^\s*1\.?\s+Introduction\b/im,
    /^\s*I\.?\s+INTRODUCTION\b/im,
    /^\s*Introduction\b/im,
    /^\s*II\.?\s+/im,  // IEEE-style section II
    /^\s*Keywords?\b/im,
    /^\s*Index Terms?\b/im,
    /^\s*Proceedings of/im,
    /^\s*Copyright/im,
    /^\s*Figure\s+\d+/im,
  ],
  doiRegexes: [
    /10\.\d{4,}\/[^\s]+/g,
  ],
  arxivRegexes: [
    /arXiv:\s*(\d{4}\.\d{4,5})/gi,
    /arxiv\.org\/abs\/(\d{4}\.\d{4,5})/gi,
  ],
  titleStrategy: "topBlock",
  authorStrategy: "betweenTitleAndAbstract",
  yearStrategy: "copyrightOrHeader",
};

// CHI (Human-Computer Interaction)
const chiProfile: ExtractionProfile = {
  venueTypes: ["CHI"],
  abstractRegexes: [
    /\bAbstract\b/i,
    /\bA\s*B\s*S\s*T\s*R\s*A\s*C\s*T\b/i,
  ],
  stopRegexes: [
    /^\s*\d+\.?\s+Introduction\b/im,
    /^\s*1\.?\s+Introduction\b/im,
    /^\s*Introduction\b/im,
    /^\s*Author\s+Keywords?\b/im,
    /^\s*Keywords?\b/im,
    /^\s*CCS\s+Concepts?\b/im,
    /^\s*ACM\s+Classification/im,
    /^\s*Proceedings of/im,
    /^\s*Copyright/im,
  ],
  doiRegexes: [
    /10\.\d{4,}\/[^\s]+/g,
  ],
  arxivRegexes: [
    /arXiv:\s*(\d{4}\.\d{4,5})/gi,
    /arxiv\.org\/abs\/(\d{4}\.\d{4,5})/gi,
  ],
  titleStrategy: "topBlock",
  authorStrategy: "betweenTitleAndAbstract",
  yearStrategy: "copyrightOrHeader",
};

// IEEE Generic / Other (fallback)
const ieeeGenericProfile: ExtractionProfile = {
  venueTypes: ["IEEE_GENERIC", "OTHER"],
  abstractRegexes: [
    /\bAbstract\b/i,
    /\bA\s*B\s*S\s*T\s*R\s*A\s*C\s*T\b/i,
  ],
  stopRegexes: [
    /^\s*\d+\.?\s+Introduction\b/im,
    /^\s*I\.?\s+INTRODUCTION\b/im,
    /^\s*1\.?\s+Introduction\b/im,
    /^\s*Introduction\b/im,
    /^\s*II\.?\s+/im,  // IEEE section II
    /^\s*Index\s+Terms?\b/im,
    /^\s*Keywords?\b/im,
    /^\s*Proceedings of/im,
    /^\s*Copyright/im,
    /^\s*Figure\s+\d+/im,
  ],
  doiRegexes: [
    /10\.\d{4,}\/[^\s]+/g,
  ],
  arxivRegexes: [
    /arXiv:\s*(\d{4}\.\d{4,5})/gi,
    /arxiv\.org\/abs\/(\d{4}\.\d{4,5})/gi,
  ],
  titleStrategy: "topBlock",
  authorStrategy: "heuristic",
  yearStrategy: "copyrightOrHeader",
};

const allProfiles = [
  aclProfile,
  mlProfile,
  securityProfile,
  chiProfile,
  ieeeGenericProfile,
];

export function getProfileForVenue(venueType: VenueType): ExtractionProfile {
  for (const profile of allProfiles) {
    if (profile.venueTypes.includes(venueType)) {
      return profile;
    }
  }
  // Fallback to IEEE Generic
  return ieeeGenericProfile;
}
