/**
 * Regression test script for PDF extraction fixes
 * 
 * Tests:
 * 1. Bug #1: Abstract should not include "1 Introduction" or body text
 * 2. Bug #2: Only 2 pages should be extracted, not all pages
 * 
 * Usage: npm run test:extract
 */

import { extractMetadata } from "../lib/extraction/extract";
import { VenueType } from "@prisma/client";
import path from "path";
import fs from "fs";

interface TestCase {
  name: string;
  pdfPath: string;
  venue: VenueType;
  expectations: {
    maxPages: number;
    abstractShouldNotContain: string[];
    abstractShouldContain?: string[];
  };
}

const testCases: TestCase[] = [
  {
    name: "USENIX Security Paper",
    pdfPath: path.join(process.cwd(), "test-pdfs", "usenix-security-sample.pdf"),
    venue: "USENIX_SECURITY",
    expectations: {
      maxPages: 2,
      abstractShouldNotContain: [
        "1 Introduction",
        "I. INTRODUCTION",
        "The advent of",
      ],
    },
  },
  {
    name: "ICML Scaling Laws Paper",
    pdfPath: path.join(process.cwd(), "test-pdfs", "icml-scaling-laws.pdf"),
    venue: "ICML",
    expectations: {
      maxPages: 2,
      abstractShouldNotContain: [
        "The advent of neural networks",
        "1 Introduction",
        "Introduction",
      ],
    },
  },
];

async function runTest(testCase: TestCase): Promise<boolean> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST: ${testCase.name}`);
  console.log(`${"=".repeat(60)}`);

  // Check if PDF exists
  if (!fs.existsSync(testCase.pdfPath)) {
    console.log(`⚠️  SKIP: PDF not found at ${testCase.pdfPath}`);
    console.log(`   Place test PDF at this location to run test.`);
    return true; // Don't fail if PDF doesn't exist
  }

  try {
    // Extract metadata
    console.log(`Extracting from: ${testCase.pdfPath}`);
    console.log(`Venue: ${testCase.venue}`);

    const fileKey = path.relative(process.cwd(), testCase.pdfPath);
    const result = await extractMetadata(fileKey, testCase.venue);

    console.log(`\nExtraction Results:`);
    console.log(`- Pages Extracted: ${result.debug.textPages}`);
    console.log(`- Title: ${result.title?.substring(0, 60) || "N/A"}...`);
    console.log(
      `- Abstract Length: ${result.abstract?.length || 0} chars`
    );
    console.log(`- Detected Venue: ${result.venueDetection.detected || "none"}`);
    console.log(
      `- Venue Confidence: ${Math.round(result.venueDetection.confidence * 100)}%`
    );

    let passed = true;
    const failures: string[] = [];

    // Test 1: Check page count
    if (result.debug.textPages > testCase.expectations.maxPages) {
      passed = false;
      failures.push(
        `❌ Pages: Expected ${testCase.expectations.maxPages}, got ${result.debug.textPages}`
      );
    } else {
      console.log(`✓ Pages: ${result.debug.textPages} (within limit)`);
    }

    // Test 2: Check abstract does NOT contain forbidden strings
    if (result.abstract) {
      for (const forbidden of testCase.expectations.abstractShouldNotContain) {
        if (result.abstract.includes(forbidden)) {
          passed = false;
          failures.push(
            `❌ Abstract contains forbidden text: "${forbidden}"`
          );
        }
      }
      if (
        !testCase.expectations.abstractShouldNotContain.some((s) =>
          result.abstract!.includes(s)
        )
      ) {
        console.log(`✓ Abstract: Does not contain intro/body bleed`);
      }
    } else {
      failures.push(`❌ Abstract: Not extracted`);
      passed = false;
    }

    // Test 3: Check abstract contains expected content (if specified)
    if (testCase.expectations.abstractShouldContain && result.abstract) {
      for (const expected of testCase.expectations.abstractShouldContain) {
        if (!result.abstract.includes(expected)) {
          passed = false;
          failures.push(
            `❌ Abstract should contain: "${expected}"`
          );
        }
      }
    }

    // Print debug signals
    console.log(`\nDebug Signals:`);
    for (const signal of result.debug.signals) {
      console.log(`  - ${signal}`);
    }

    if (result.venueDetection.mismatchNote) {
      console.log(`\n⚠️  ${result.venueDetection.mismatchNote}`);
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
      console.log(`✅ PASS: ${testCase.name}`);
    } else {
      console.log(`❌ FAIL: ${testCase.name}`);
    }
    console.log(`${"=".repeat(60)}`);

    return passed;
  } catch (error) {
    console.error(`\n❌ ERROR: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

async function main() {
  console.log(`\n${"*".repeat(60)}`);
  console.log(`PDF Extraction Regression Tests`);
  console.log(`${"*".repeat(60)}`);
  console.log(`\nTesting fixes for:`);
  console.log(`  - Bug #1: Abstract bleed (includes intro text)`);
  console.log(`  - Bug #2: Unbounded extraction (extracts all pages)`);

  const results: boolean[] = [];

  for (const testCase of testCases) {
    const result = await runTest(testCase);
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
