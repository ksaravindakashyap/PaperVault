/**
 * Batch embedding script — run with: npx tsx --env-file=.env.local src/scripts/embed-papers.ts
 * Generates pgvector embeddings for all Paper and ExternalPaper records that don't have one yet.
 */
import "../lib/loadEnv";
import { db } from "../lib/db";
import { embedPaper, paperTextForEmbedding, generateEmbedding } from "../lib/embeddings";

const BATCH_DELAY_MS = 200; // avoid hammering the API

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function embedLocalPapers() {
  const papers = await db.paper.findMany({
    where: {
      OR: [{ embeddingStatus: null }, { embeddingStatus: "PENDING" }, { embeddingStatus: "FAILED" }],
      // Embed regardless of reading status — papers can be moved before embedding runs
      status: { notIn: ["PROCESSING"] },
    },
    select: { id: true, title: true, abstract: true, authors: true, year: true },
  });

  console.log(`\nFound ${papers.length} local papers needing embeddings`);

  let done = 0;
  let failed = 0;

  for (const paper of papers) {
    try {
      const vec = await embedPaper(paper);
      const vecLiteral = `[${vec.join(",")}]`;
      await db.$executeRaw`
        UPDATE "Paper"
        SET embedding = ${vecLiteral}::vector,
            "embeddingStatus" = 'DONE',
            "embeddedAt" = NOW()
        WHERE id = ${paper.id}
      `;
      done++;
      process.stdout.write(`\r  Local papers: ${done} done, ${failed} failed`);
    } catch (err) {
      if (failed === 0) console.error("\n  First failure:", err);
      failed++;
      await db.paper.update({
        where: { id: paper.id },
        data: { embeddingStatus: "FAILED" },
      });
    }
    await sleep(BATCH_DELAY_MS);
  }

  console.log(`\n  Done: ${done}, Failed: ${failed}`);
}

async function embedExternalPapers() {
  const papers = await db.externalPaper.findMany({
    where: {
      OR: [{ embeddingStatus: null }, { embeddingStatus: "PENDING" }, { embeddingStatus: "FAILED" }],
      abstract: { not: null },
    },
    select: { id: true, title: true, abstract: true, authors: true, year: true, venue: true },
  });

  console.log(`\nFound ${papers.length} external papers needing embeddings`);

  let done = 0;
  let failed = 0;

  for (const paper of papers) {
    try {
      const text = paperTextForEmbedding({
        title: paper.title,
        abstract: paper.abstract,
        authors: paper.authors,
        venue: paper.venue,
        year: paper.year,
      });
      const vec = await generateEmbedding(text, "passage");
      const vecLiteral = `[${vec.join(",")}]`;
      await db.$executeRaw`
        UPDATE "ExternalPaper"
        SET embedding = ${vecLiteral}::vector,
            "embeddingStatus" = 'DONE',
            "embeddedAt" = NOW()
        WHERE id = ${paper.id}
      `;
      done++;
      process.stdout.write(`\r  External papers: ${done} done, ${failed} failed`);
    } catch (err) {
      if (failed === 0) console.error("\n  First failure:", err);
      failed++;
      await db.externalPaper.update({
        where: { id: paper.id },
        data: { embeddingStatus: "FAILED" },
      });
    }
    await sleep(BATCH_DELAY_MS);
  }

  console.log(`\n  Done: ${done}, Failed: ${failed}`);
}

async function main() {
  console.log("=== PaperVault Embedding Backfill ===");

  // Reset previously failed so they are retried this run
  const { count: p } = await db.paper.updateMany({ where: { embeddingStatus: "FAILED" }, data: { embeddingStatus: "PENDING" } });
  const { count: e } = await db.externalPaper.updateMany({ where: { embeddingStatus: "FAILED" }, data: { embeddingStatus: "PENDING" } });
  if (p + e > 0) console.log(`Reset ${p} local + ${e} external previously-failed papers`);

  await embedLocalPapers();
  await embedExternalPapers();
  console.log("\n✓ Embedding backfill complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
