#!/usr/bin/env tsx
/**
 * Smoke test for demo routes data integrity
 * Validates that demo-data.ts contains required fields and minimum dataset
 * 
 * Usage: npm run smoke:demo
 */

import { demoData } from "../demo/demo-data";

interface ValidationError {
  type: string;
  message: string;
}

const errors: ValidationError[] = [];

function validatePapers() {
  const { papers } = demoData;
  
  if (!papers || papers.length < 8) {
    errors.push({
      type: "papers",
      message: `Expected at least 8 papers, got ${papers?.length || 0}`,
    });
    return;
  }

  papers.forEach((paper, index) => {
    const requiredFields = ["id", "title", "authors", "year", "venueType", "status", "abstract", "createdAt", "updatedAt"];
    const missingFields = requiredFields.filter(field => !(field in paper) || paper[field as keyof typeof paper] === undefined);
    
    if (missingFields.length > 0) {
      errors.push({
        type: "papers",
        message: `Paper ${index} (${paper.id}) missing fields: ${missingFields.join(", ")}`,
      });
    }

    if (paper.year < 2020 || paper.year > 2030) {
      errors.push({
        type: "papers",
        message: `Paper ${index} (${paper.id}) has invalid year: ${paper.year}`,
      });
    }

    if (!paper.title || paper.title.length < 10) {
      errors.push({
        type: "papers",
        message: `Paper ${index} (${paper.id}) has invalid title: "${paper.title}"`,
      });
    }

    if (!paper.abstract || paper.abstract.length < 50) {
      errors.push({
        type: "papers",
        message: `Paper ${index} (${paper.id}) has invalid abstract (too short or missing)`,
      });
    }

    const validStatuses = ["PROCESSING", "READY", "FAILED", "TO_READ", "SKIMMED", "DEEP_READ", "INTEGRATED"];
    if (!validStatuses.includes(paper.status)) {
      errors.push({
        type: "papers",
        message: `Paper ${index} (${paper.id}) has invalid status: ${paper.status}`,
      });
    }
  });

  console.log(`✓ Validated ${papers.length} papers`);
}

function validateProjects() {
  const { projects } = demoData;
  
  if (!projects || projects.length < 2) {
    errors.push({
      type: "projects",
      message: `Expected at least 2 projects, got ${projects?.length || 0}`,
    });
    return;
  }

  projects.forEach((project, index) => {
    const requiredFields = ["id", "name", "createdAt", "updatedAt", "paperIds", "docIds", "todoIds"];
    const missingFields = requiredFields.filter(field => !(field in project));
    
    if (missingFields.length > 0) {
      errors.push({
        type: "projects",
        message: `Project ${index} (${project.id}) missing fields: ${missingFields.join(", ")}`,
      });
    }
  });

  console.log(`✓ Validated ${projects.length} projects`);
}

function validateTags() {
  const { tags } = demoData;
  
  if (!tags || tags.length < 5) {
    errors.push({
      type: "tags",
      message: `Expected at least 5 tags, got ${tags?.length || 0}`,
    });
    return;
  }

  tags.forEach((tag, index) => {
    if (!tag.id || !tag.name || !tag.createdAt) {
      errors.push({
        type: "tags",
        message: `Tag ${index} missing required fields`,
      });
    }
  });

  console.log(`✓ Validated ${tags.length} tags`);
}

function validatePaperTags() {
  const { paperTags, papers, tags } = demoData;
  
  if (!paperTags || paperTags.length === 0) {
    errors.push({
      type: "paperTags",
      message: `Expected paper-tag relationships, got ${paperTags?.length || 0}`,
    });
    return;
  }

  paperTags.forEach((pt, index) => {
    const paperExists = papers.some(p => p.id === pt.paperId);
    const tagExists = tags.some(t => t.id === pt.tagId);
    
    if (!paperExists) {
      errors.push({
        type: "paperTags",
        message: `PaperTag ${index} references non-existent paper: ${pt.paperId}`,
      });
    }
    
    if (!tagExists) {
      errors.push({
        type: "paperTags",
        message: `PaperTag ${index} references non-existent tag: ${pt.tagId}`,
      });
    }
  });

  console.log(`✓ Validated ${paperTags.length} paper-tag relationships`);
}

function validateDocs() {
  const { docs, projects } = demoData;
  
  if (!docs || docs.length === 0) {
    console.log(`⚠ Warning: No docs in demo data (optional)`);
    return;
  }

  docs.forEach((doc, index) => {
    const requiredFields = ["id", "projectId", "title", "content", "createdAt", "updatedAt"];
    const missingFields = requiredFields.filter(field => !(field in doc));
    
    if (missingFields.length > 0) {
      errors.push({
        type: "docs",
        message: `Doc ${index} (${doc.id}) missing fields: ${missingFields.join(", ")}`,
      });
    }

    const projectExists = projects.some(p => p.id === doc.projectId);
    if (!projectExists) {
      errors.push({
        type: "docs",
        message: `Doc ${index} (${doc.id}) references non-existent project: ${doc.projectId}`,
      });
    }
  });

  console.log(`✓ Validated ${docs.length} docs`);
}

function validateTodos() {
  const { todos, projects } = demoData;
  
  if (!todos || todos.length === 0) {
    console.log(`⚠ Warning: No todos in demo data (optional)`);
    return;
  }

  todos.forEach((todo, index) => {
    const requiredFields = ["id", "projectId", "title", "dueDate", "status", "createdAt", "updatedAt"];
    const missingFields = requiredFields.filter(field => !(field in todo));
    
    if (missingFields.length > 0) {
      errors.push({
        type: "todos",
        message: `Todo ${index} (${todo.id}) missing fields: ${missingFields.join(", ")}`,
      });
    }

    const projectExists = projects.some(p => p.id === todo.projectId);
    if (!projectExists) {
      errors.push({
        type: "todos",
        message: `Todo ${index} (${todo.id}) references non-existent project: ${todo.projectId}`,
      });
    }

    const validStatuses = ["OPEN", "DONE", "CANCELLED"];
    if (!validStatuses.includes(todo.status)) {
      errors.push({
        type: "todos",
        message: `Todo ${index} (${todo.id}) has invalid status: ${todo.status}`,
      });
    }
  });

  console.log(`✓ Validated ${todos.length} todos`);
}

function validateCitations() {
  const { citations, papers } = demoData;
  
  if (!citations || citations.length === 0) {
    console.log(`⚠ Warning: No citations in demo data (optional)`);
    return;
  }

  citations.forEach((citation, index) => {
    if (!citation.id || !citation.sourcePaperId || !citation.raw) {
      errors.push({
        type: "citations",
        message: `Citation ${index} missing required fields`,
      });
    }

    const paperExists = papers.some(p => p.id === citation.sourcePaperId);
    if (!paperExists) {
      errors.push({
        type: "citations",
        message: `Citation ${index} (${citation.id}) references non-existent paper: ${citation.sourcePaperId}`,
      });
    }
  });

  console.log(`✓ Validated ${citations.length} citations`);
}

function main() {
  console.log("🔍 Smoke testing demo data...\n");

  try {
    validatePapers();
    validateProjects();
    validateTags();
    validatePaperTags();
    validateDocs();
    validateTodos();
    validateCitations();

    if (errors.length === 0) {
      console.log("\n✅ All demo data validation checks passed!");
      console.log(`\nSummary:`);
      console.log(`  - ${demoData.papers.length} papers`);
      console.log(`  - ${demoData.projects.length} projects`);
      console.log(`  - ${demoData.docs.length} docs`);
      console.log(`  - ${demoData.todos.length} todos`);
      console.log(`  - ${demoData.tags.length} tags`);
      console.log(`  - ${demoData.citations.length} citations`);
      console.log(`  - ${demoData.paperTags.length} paper-tag relationships`);
      console.log(`  - ${demoData.docTags.length} doc-tag relationships`);
      process.exit(0);
    } else {
      console.log("\n❌ Demo data validation failed!\n");
      errors.forEach(error => {
        console.log(`  [${error.type}] ${error.message}`);
      });
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Unexpected error during validation:");
    console.error(error);
    process.exit(1);
  }
}

main();
