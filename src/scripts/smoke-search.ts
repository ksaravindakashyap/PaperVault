import { db } from "../lib/db";

async function smokeSearch() {
  console.log("🔍 Running search smoke test...\n");

  try {
    // Find or create a test paper with "WASP" in title
    const testTitle = "WASP: Web Application Security Protocol";
    let testPaper = await db.paper.findFirst({
      where: {
        title: {
          contains: "WASP",
          mode: "insensitive",
        },
      },
    });

    if (!testPaper) {
      console.log("Creating test paper with WASP in title...");
      testPaper = await db.paper.create({
        data: {
          fileKey: "test/wasp.pdf",
          originalFileName: "wasp-test.pdf",
          venueType: "OTHER",
          status: "READY",
          title: testTitle,
          authors: "Test Author",
          year: 2024,
        },
      });
      console.log(`✅ Created test paper: ${testPaper.id}`);
    } else {
      console.log(`✅ Found existing test paper: ${testPaper.id}`);
    }

    // Test case-insensitive search
    console.log("\n📝 Testing case-insensitive search...");
    const searchQueries = ["wasp", "WASP", "Wasp", "wasP"];

    for (const query of searchQueries) {
      const results = await db.paper.findMany({
        where: {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
      });

      const found = results.some((p) => p.id === testPaper!.id);
      console.log(
        found
          ? `✅ Query "${query}" found test paper`
          : `❌ Query "${query}" did NOT find test paper`
      );
    }

    // Test tokenization (multi-word)
    console.log("\n📝 Testing tokenization...");
    const multiWordQuery = "Web Application Security";
    const tokens = multiWordQuery.toLowerCase().split(/\s+/).filter((t) => t.length >= 2);

    const tokenResults = await db.paper.findMany({
      where: {
        OR: tokens.flatMap((token) => [
          { title: { contains: token, mode: "insensitive" } },
        ]),
      },
    });

    const foundByTokens = tokenResults.some((p) => p.id === testPaper!.id);
    console.log(
      foundByTokens
        ? `✅ Tokenized query "${multiWordQuery}" found test paper`
        : `❌ Tokenized query "${multiWordQuery}" did NOT find test paper`
    );

    console.log("\n✨ Search smoke test completed!");
  } catch (error) {
    console.error("❌ Search smoke test failed:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

smokeSearch();
