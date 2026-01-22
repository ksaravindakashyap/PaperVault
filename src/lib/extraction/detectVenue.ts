import { VenueType } from "@prisma/client";

export interface VenueDetectionResult {
  detected?: VenueType;
  note?: string;
  confidence: number;
  signals: string[];
}

interface VenueSignal {
  venue: VenueType;
  patterns: RegExp[];
  weight: number;
}

const venueSignals: VenueSignal[] = [
  {
    venue: "ICML",
    patterns: [
      /International Conference on Machine Learning/i,
      /\bICML\b/,
      /Proceedings of.*ICML/i,
    ],
    weight: 1.0,
  },
  {
    venue: "NEURIPS",
    patterns: [
      /Neural Information Processing Systems/i,
      /\bNeurIPS\b/i,
      /\bNIPS\b/,
      /Advances in Neural Information Processing/i,
    ],
    weight: 1.0,
  },
  {
    venue: "ICLR",
    patterns: [
      /International Conference on Learning Representations/i,
      /\bICLR\b/,
      /Proceedings of.*ICLR/i,
    ],
    weight: 1.0,
  },
  {
    venue: "ACL",
    patterns: [
      /Association for Computational Linguistics/i,
      /\bACL\b.*\d{4}/,
      /Proceedings of.*ACL/i,
    ],
    weight: 1.0,
  },
  {
    venue: "EMNLP",
    patterns: [
      /Empirical Methods in Natural Language Processing/i,
      /\bEMNLP\b/,
      /Proceedings of.*EMNLP/i,
    ],
    weight: 1.0,
  },
  {
    venue: "NAACL",
    patterns: [
      /North American.*Association for Computational Linguistics/i,
      /\bNAACL\b/,
      /Proceedings of.*NAACL/i,
    ],
    weight: 1.0,
  },
  {
    venue: "USENIX_SECURITY",
    patterns: [
      /USENIX Security Symposium/i,
      /USENIX Security/i,
      /Proceedings of.*USENIX.*Security/i,
    ],
    weight: 1.0,
  },
  {
    venue: "CCS",
    patterns: [
      /\bCCS\b.*Computer and Communications Security/i,
      /ACM Conference on Computer and Communications Security/i,
      /Proceedings of.*CCS/i,
    ],
    weight: 1.0,
  },
  {
    venue: "NDSS",
    patterns: [
      /\bNDSS\b/,
      /Network and Distributed System Security/i,
      /Proceedings of.*NDSS/i,
    ],
    weight: 1.0,
  },
  {
    venue: "CHI",
    patterns: [
      /\bCHI\b.*\d{4}/,
      /Human Factors in Computing Systems/i,
      /Proceedings of.*CHI/i,
      /ACM.*CHI Conference/i,
    ],
    weight: 1.0,
  },
];

/**
 * Detect venue type from PDF text using heuristic patterns
 * @param text - Extracted text from PDF (first 2 pages)
 * @returns Detection result with confidence score
 */
export function detectVenueFromText(text: string): VenueDetectionResult {
  const signals: string[] = [];
  const scores: Map<VenueType, number> = new Map();

  // Check each venue's patterns
  for (const signal of venueSignals) {
    for (const pattern of signal.patterns) {
      if (pattern.test(text)) {
        const currentScore = scores.get(signal.venue) || 0;
        scores.set(signal.venue, currentScore + signal.weight);
        signals.push(`Found ${signal.venue} pattern: ${pattern.source}`);
        break; // One match per venue signal is enough
      }
    }
  }

  // Find venue with highest score
  let bestVenue: VenueType | undefined;
  let bestScore = 0;

  for (const [venue, score] of scores.entries()) {
    if (score > bestScore) {
      bestScore = score;
      bestVenue = venue;
    }
  }

  // Calculate confidence (0-1 scale)
  const confidence = Math.min(bestScore, 1.0);

  if (bestVenue && confidence >= 0.5) {
    return {
      detected: bestVenue,
      confidence,
      signals,
    };
  }

  return {
    confidence: 0,
    signals: signals.length > 0 ? signals : ["No venue signals detected"],
  };
}

/**
 * Generate mismatch note if detected venue differs from selected
 */
export function generateMismatchNote(
  selectedVenue: VenueType,
  detectedVenue: VenueType,
  confidence: number
): string {
  const confidencePercent = Math.round(confidence * 100);
  return `Selected ${selectedVenue} but detected ${detectedVenue} from PDF text (${confidencePercent}% confidence). Consider reprocessing with detected venue profile.`;
}
