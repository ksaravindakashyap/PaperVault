# Test PDFs for Extraction Regression Tests

Place sample PDFs in this directory to test extraction quality.

## Required Test Cases

### 1. USENIX Security Paper
**Filename**: `usenix-security-sample.pdf`
**Purpose**: Test USENIX-style papers with "1 Introduction" headers
**Expected**:
- Abstract stops at "1 Introduction"
- No body text bleed
- 2 pages extracted only

### 2. ICML/NeurIPS Paper (Scaling Laws)
**Filename**: `icml-scaling-laws.pdf`
**Purpose**: Test ML conference papers that may lack explicit intro headers
**Expected**:
- Abstract does not include "The advent of neural networks" or similar intro text
- Citation trimming prevents intro bleed
- 2 pages extracted only

## Running Tests

```bash
npm run test:extract
```

The test script will:
1. Check if PDFs exist (skips if missing)
2. Extract metadata with appropriate venue profile
3. Verify:
   - Only 2 pages extracted
   - Abstract does not contain forbidden intro text
   - Extraction signals are correct

## Sample PDFs to Use

You can use any conference papers, but these types work well:

**USENIX Security:**
- Any USENIX Security Symposium paper
- Should have clear "1 Introduction" section

**ICML/NeurIPS:**
- NeurIPS or ICML papers from recent years
- Often have abstracts followed by body text without numbered headers

**Alternative Test:**
- Use any 20+ page research PDF
- Verify only 2 pages are extracted (not all 20+)
- Check worker logs for "Extracted 2 of X pages"

## Manual Testing

If you don't have test PDFs, you can test with any research PDFs:

1. Upload a PDF via the UI
2. Start worker: `npm run worker`
3. Check worker logs for:
   - "Extracted 2 of X pages" (should be 2, not all pages)
   - Venue detection results
   - Mismatch warnings if applicable

## Adding More Tests

Edit `src/scripts/test-extraction.ts` to add more test cases:

```typescript
const testCases: TestCase[] = [
  {
    name: "Your Test Name",
    pdfPath: path.join(process.cwd(), "test-pdfs", "your-file.pdf"),
    venue: "ACL", // or other VenueType
    expectations: {
      maxPages: 2,
      abstractShouldNotContain: ["1 Introduction", "The advent of"],
    },
  },
];
```
