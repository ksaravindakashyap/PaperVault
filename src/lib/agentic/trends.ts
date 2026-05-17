import { ExternalPaper } from "@prisma/client";

export interface TrendingTopic {
  topic: string;
  paperCount: number;
  avgCitations: number;
  score: number;
  topPapers: string[];
  conferences: string[];
}

export function detectTrendingTopics(
  papers: ExternalPaper[],
  topN: number = 5
): TrendingTopic[] {
  // Extract topics from titles and abstracts using TF-IDF-like scoring
  const topicMap = new Map<string, {
    count: number;
    citations: number[];
    papers: string[];
    venues: Set<string>;
  }>();

  for (const paper of papers) {
    const text = `${paper.title} ${paper.abstract || ""}`.toLowerCase();
    const words = text.split(/\W+/).filter(w => w.length > 4);
    
    // Simple topic extraction (can be enhanced with LLM)
    const topics = extractKeyPhrases(words);
    
    for (const topic of topics) {
      if (!topicMap.has(topic)) {
        topicMap.set(topic, { count: 0, citations: [], papers: [], venues: new Set() });
      }
      const entry = topicMap.get(topic)!;
      entry.count++;
      entry.citations.push(paper.citationCount || 0);
      entry.papers.push(paper.id);
      if (paper.venue) entry.venues.add(paper.venue);
    }
  }

  // Score topics by frequency * avg citations
  const scored = Array.from(topicMap.entries())
    .map(([topic, data]) => {
      const avgCitations = data.citations.reduce((a, b) => a + b, 0) / Math.max(data.citations.length, 1);
      const score = data.count * Math.log1p(avgCitations);
      return {
        topic,
        paperCount: data.count,
        avgCitations,
        score,
        topPapers: data.papers.slice(0, 3),
        conferences: Array.from(data.venues),
      };
    })
    .filter(t => t.paperCount >= 2)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
}

function extractKeyPhrases(words: string[]): string[] {
  // Simple bigram and trigram extraction
  const phrases: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
    if (i < words.length - 2) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }
  return phrases;
}
