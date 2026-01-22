#!/usr/bin/env tsx
/**
 * Validates that demo routes are Netlify-safe (no DB/FS dependencies)
 * 
 * Usage: npm run validate:demo-netlify
 */

import * as fs from "fs";
import * as path from "path";

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

const DEMO_DIR = path.join(process.cwd(), "src", "app", "demo");
const DEMO_PROVIDER_DIR = path.join(process.cwd(), "src", "demo");

function findTsxFiles(dir: string): string[] {
  const files: string[] = [];
  
  function walk(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function checkFileForProhibitedImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const errors: string[] = [];
  
  const prohibitedPatterns = [
    { pattern: /from\s+["']@\/lib\/db["']/g, name: "Database import (@/lib/db)" },
    { pattern: /from\s+["']@prisma\/client["']/g, name: "Prisma client import" },
    { pattern: /from\s+["']fs["']/g, name: "File system import (fs)" },
    { pattern: /from\s+["']fs\/promises["']/g, name: "File system import (fs/promises)" },
    { pattern: /from\s+["']node:fs["']/g, name: "File system import (node:fs)" },
    { pattern: /require\(["']fs["']\)/g, name: "File system require (fs)" },
  ];
  
  for (const { pattern, name } of prohibitedPatterns) {
    if (pattern.test(content)) {
      errors.push(`${name} found in ${path.relative(process.cwd(), filePath)}`);
    }
  }
  
  // Check for fetch calls to /api/* (should not call backend APIs)
  const apiFetchPattern = /fetch\s*\(\s*["']\/api\//g;
  if (apiFetchPattern.test(content)) {
    errors.push(`API fetch call found in ${path.relative(process.cwd(), filePath)} - demo should not call backend APIs`);
  }
  
  return errors;
}

function validateDemoRoutes(): ValidationResult {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
  };
  
  console.log("🔍 Validating demo routes for Netlify safety...\n");
  
  // Check demo app routes
  console.log("Checking demo app routes...");
  const demoFiles = findTsxFiles(DEMO_DIR);
  console.log(`  Found ${demoFiles.length} files in src/app/demo/\n`);
  
  for (const file of demoFiles) {
    const errors = checkFileForProhibitedImports(file);
    if (errors.length > 0) {
      result.errors.push(...errors);
      result.passed = false;
    }
  }
  
  // Check demo provider
  console.log("Checking demo provider...");
  const providerFiles = findTsxFiles(DEMO_PROVIDER_DIR);
  console.log(`  Found ${providerFiles.length} files in src/demo/\n`);
  
  for (const file of providerFiles) {
    const errors = checkFileForProhibitedImports(file);
    if (errors.length > 0) {
      result.errors.push(...errors);
      result.passed = false;
    }
  }
  
  // Check that demo-data.ts exists and is pure
  const demoDataPath = path.join(DEMO_PROVIDER_DIR, "demo-data.ts");
  if (!fs.existsSync(demoDataPath)) {
    result.errors.push("demo-data.ts not found in src/demo/");
    result.passed = false;
  } else {
    const content = fs.readFileSync(demoDataPath, "utf-8");
    
    // Check for runtime dependencies
    if (content.includes("fs.readFileSync") || content.includes("readFile")) {
      result.errors.push("demo-data.ts contains file system reads - data must be static");
      result.passed = false;
    }
    
    if (content.includes("fetch(") || content.includes("axios")) {
      result.errors.push("demo-data.ts contains network calls - data must be static");
      result.passed = false;
    }
    
    // Verify it exports demoData
    if (!content.includes("export const demoData")) {
      result.errors.push("demo-data.ts does not export 'demoData'");
      result.passed = false;
    }
  }
  
  // Check that demo layout exists
  const demoLayoutPath = path.join(DEMO_DIR, "layout.tsx");
  if (!fs.existsSync(demoLayoutPath)) {
    result.errors.push("Demo layout.tsx not found in src/app/demo/");
    result.passed = false;
  } else {
    const content = fs.readFileSync(demoLayoutPath, "utf-8");
    if (!content.includes("DemoProvider")) {
      result.warnings.push("Demo layout does not use DemoProvider");
    }
    if (!content.includes('"use client"')) {
      result.warnings.push("Demo layout is not a client component");
    }
  }
  
  // Check that demo-provider.tsx exists
  const demoProviderPath = path.join(DEMO_PROVIDER_DIR, "demo-provider.tsx");
  if (!fs.existsSync(demoProviderPath)) {
    result.errors.push("demo-provider.tsx not found in src/demo/");
    result.passed = false;
  } else {
    const content = fs.readFileSync(demoProviderPath, "utf-8");
    if (!content.includes("createContext")) {
      result.errors.push("demo-provider.tsx does not use React Context");
      result.passed = false;
    }
    if (!content.includes("export function useDemo")) {
      result.errors.push("demo-provider.tsx does not export useDemo hook");
      result.passed = false;
    }
  }
  
  return result;
}

function main() {
  const result = validateDemoRoutes();
  
  if (result.warnings.length > 0) {
    console.log("⚠️  Warnings:\n");
    result.warnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
    console.log();
  }
  
  if (result.errors.length > 0) {
    console.log("❌ Validation failed!\n");
    console.log("Errors:\n");
    result.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
    console.log("\nDemo routes are NOT Netlify-safe!");
    process.exit(1);
  } else {
    console.log("✅ All validation checks passed!\n");
    console.log("Demo routes are Netlify-safe:");
    console.log("  ✓ No database imports");
    console.log("  ✓ No file system imports");
    console.log("  ✓ No backend API calls");
    console.log("  ✓ Pure client-side React components");
    console.log("  ✓ Static demo data only\n");
    process.exit(0);
  }
}

main();
