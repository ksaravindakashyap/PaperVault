async function testAgenticSearch() {
  const testQuery = "transformers for protein structure prediction";
  
  console.log("=".repeat(60));
  console.log("Agentic Search Endpoint Test");
  console.log("=".repeat(60));
  console.log("");
  console.log("NOTE: This test requires:");
  console.log("  1. Dev server running (npm run dev)");
  console.log("  2. Valid API keys in .env.local");
  console.log("  3. Authenticated user session");
  console.log("");
  console.log("For a proper test, use the UI component or make an");
  console.log("authenticated request through the browser.");
  console.log("");
  console.log("Testing endpoint availability...");
  console.log("Query:", testQuery);
  console.log("");
  
  try {
    const response = await fetch("http://localhost:3000/api/search/agentic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: testQuery })
    });

    console.log("Response status:", response.status);
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log("");
      console.log("⚠ Authentication required (expected for smoke test)");
      console.log("");
      console.log("To test the full functionality:");
      console.log("  1. Start dev server: npm run dev");
      console.log("  2. Open browser: http://localhost:3000");
      console.log("  3. Visit the library page to create a session");
      console.log("  4. Use the AgenticSearchDialog component");
      console.log("");
      console.log("✓ API endpoint is responding correctly");
      return;
    }
    
    if (response.ok) {
      console.log("✓ Success!");
      console.log("");
      console.log("Decomposition:");
      console.log("  Intent:", data.decomposition?.intent);
      console.log("  Keywords:", data.decomposition?.keywords?.join(", "));
      console.log("  Venues:", data.decomposition?.venues?.join(", "));
      console.log("");
      console.log("Results:");
      console.log("  Total papers:", data.results?.total);
      console.log("  Conferences:", Object.keys(data.results?.byConference || {}).join(", "));
      console.log("");
      console.log("Trending topics:");
      if (data.trends?.length > 0) {
        data.trends.forEach((trend: { topic: string; paperCount: number; avgCitations: number }, i: number) => {
          console.log(`  ${i + 1}. ${trend.topic} (${trend.paperCount} papers, avg ${trend.avgCitations.toFixed(1)} citations)`);
        });
      } else {
        console.log("  (none detected)");
      }
    } else {
      console.log("✗ Error:");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log("");
    console.log("✗ Connection failed - is the dev server running?");
    console.log("  Start it with: npm run dev");
    console.log("");
    if (error instanceof Error) {
      console.log("Error:", error.message);
    }
  }
  
  console.log("");
  console.log("=".repeat(60));
}

testAgenticSearch().catch(console.error);
