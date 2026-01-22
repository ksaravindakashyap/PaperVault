/**
 * Smoke test for title extraction quality
 * 
 * Validates that extracted titles are clean and don't contain:
 * - URLs
 * - Emails
 * - Institution names
 * - Conference boilerplate
 * 
 * Usage: npm run smoke:title
 */

import { extractMetadata } from "../lib/extraction/extract";
import { VenueType } from "@prisma/client";
import path from "path";
import fs from "fs";

interface TitleTest {
  name: string;
  pdfPath: string;
  venue: VenueType;
  mustNotContain: string[];
  minLength: number;
  maxLength: number;
}

const titleTests: TitleTest[] = [
  {
    name: "USENIX Security Paper",
    pdfPath: path.join(
      process.cwd(),
      "test-pdfs",
      "usenix-security-sample.pdf"
    ),
    venue: "USENIX_SECURITY",
    mustNotContain: [
      "http",
      "usenix.org",
      "ETH Zurich",
      "USENIX Security Symposium",
      "@",
      "University",
      "Institute",
    ],
    minLength: 20,
    maxLength: 220,
  },
  {
    name: "ICML Scaling Laws Paper",
    pdfPath: path.join(
      process.cwd(),
      "test-pdfs",
      "icml-scaling-laws.pdf"
    ),
    venue: "ICML",
    mustNotContain: [
      "http",
      "@",
      "University",
      "Institute",
      "Proceedings of",
      "ICML",
      "et al",
    ],
    minLength: 20,
    maxLength: 220,
  },
  {
    name: "AidFuzzer Multi-line Title",
    pdfPath: path.join(
      process.cwd(),
      "test-pdfs",
      "aidfuzzer.pdf"
    ),
    venue: "USENIX_SECURITY",
    mustNotContain: [
      "http",
      "usenix.org",
      "ETH Zurich",
      "USENIX Security Symposium",
      "@",
      "University",
    ],
    minLength: 40,
    maxLength: 220,
  },
];

async function runTitleTest(test: TitleTest): Promise<boolean> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TITLE TEST: ${test.name}`);
  console.log(`${"=".repeat(60)}`);

  // Check if PDF exists
  if (!fs.existsSync(test.pdfPath)) {
    console.log(`⚠️  SKIP: PDF not found at ${test.pdfPath}`);
    console.log(`   Place test PDF at this location to run test.`);
    return true; // Don't fail if PDF doesn't exist
  }

  try {
    console.log(`Extracting from: ${test.pdfPath}`);
    console.log(`Venue: ${test.venue}`);

    const fileKey = path.relative(process.cwd(), test.pdfPath);
    const result = await extractMetadata(fileKey, test.venue);

    console.log(`\nExtracted Title:`);
    console.log(`"${result.title || "N/A"}"`);

    if (!result.title) {
      console.log(`\n❌ FAIL: No title extracted`);
      return false;
    }

    let passed = true;
    const failures: string[] = [];

    // Test 1: Length check
    const titleLen = result.title.length;
    if (titleLen < test.minLength || titleLen > test.maxLength) {
      passed = false;
      failures.push(
        `❌ Length: ${titleLen} chars (expected ${test.minLength}-${test.maxLength})`
      );
    } else {
      console.log(`✓ Length: ${titleLen} chars (within bounds)`);
    }

    // Test 2: Must not contain forbidden strings
    for (const forbidden of test.mustNotContain) {
      if (result.title.toLowerCase().includes(forbidden.toLowerCase())) {
        passed = false;
        failures.push(
          `❌ Title contains forbidden text: "${forbidden}"`
        );
      }
    }

    if (passed) {
      console.log(`✓ Title does not contain forbidden patterns`);
    }

    // Test 3: For AidFuzzer, check completeness
    if (test.name.includes("AidFuzzer")) {
      const requiredTerms = ["Fuzzing", "Run-Time"];
      for (const term of requiredTerms) {
        if (!result.title.includes(term)) {
          passed = false;
          failures.push(
            `❌ AidFuzzer title should contain "${term}" (multi-line title test)`
          );
        }
      }
      if (result.title && requiredTerms.every((term) => result.title!.includes(term))) {
        console.log(`✓ AidFuzzer title is complete (multi-line extracted)`);
      }
    }

    // Show extraction signals for debugging
    console.log(`\nExtraction Signals:`);
    for (const signal of result.debug.signals.slice(0, 10)) {
      console.log(`  - ${signal}`);
    }

    // Print failures
    if (failures.length > 0) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`FAILURES:`);
      for (const failure of failures) {
        console.log(failure);
      }
    }

    // Final result
    console.log(`\n${"=".repeat(60)}`);
    if (passed) {
      console.log(`✅ PASS: ${test.name}`);
    } else {
      console.log(`❌ FAIL: ${test.name}`);
    }
    console.log(`${"=".repeat(60)}`);

    return passed;
  } catch (error) {
    console.error(
      `\n❌ ERROR: ${error instanceof Error ? error.message : error}`
    );
    return false;
  }
}

async function main() {
  console.log(`\n${"*".repeat(60)}`);
  console.log(`Title Extraction Quality - Smoke Tests`);
  console.log(`${"*".repeat(60)}`);
  console.log(`\nValidating that titles are clean and accurate.`);

  const results: boolean[] = [];

  for (const test of titleTests) {
    const result = await runTitleTest(test);
    results.push(result);
  }

  // Summary
  const passed = results.filter((r) => r).length;
  const total = results.length;

  console.log(`\n${"*".repeat(60)}`);
  console.log(`SUMMARY: ${passed}/${total} tests passed`);
  console.log(`${"*".repeat(60)}\n`);

  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
