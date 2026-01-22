# PaperVault

PaperVault is a paper-centric workspace designed for research workflows. Instead of treating research as generic documents and folders, it models the objects researchers actually use every day: papers (PDFs), metadata, BibTeX, references, reading status, project libraries, lab notes, and shared docs.

It’s built to reduce the friction between “I found a paper” and “this paper is now organized, summarized, and connected to a project I’m working on.”

---

## What it is

PaperVault is a lightweight research hub that helps individuals and labs:
- keep a structured paper library (PDF-first),
- extract and standardize metadata and citations,
- organize papers into projects,
- track reading progress,
- collaborate through shared docs, comments, and audit trails.

The focus is pragmatic: clear UX, research-native primitives, and deterministic processing.

---

## Who it’s for

PaperVault is useful for:

- **Graduate students & researchers** building literature reviews and maintaining reading pipelines
- **Lab groups** that share papers, meeting notes, and project context
- **Systems / ML / Security teams** that want traceable research organization without heavy tooling
- **Anyone writing papers** who wants BibTeX, references, and project structure in one place

If your current workflow is “PDFs in folders + scattered Google Docs + a messy BibTeX file,” PaperVault is designed to consolidate that into a single research-native workspace.

---

## What it does

### 1) Paper-centric library (PDF-first)
- Upload PDFs and keep them in a structured library
- Extract key metadata (title, authors, year, abstract, DOI/arXiv when available)
- Generate BibTeX entries with copy support
- Maintain per-paper summaries/notes

**Why it helps:** reduces manual copy-paste and keeps paper context consistent across a project.

### 2) References / citations (iterative)
- Extract “References” from the PDF and display them on the paper page
- Attempt to link a cited reference to an internal paper when possible (DOI/arXiv/title heuristics)

**Why it helps:** makes it easier to follow related work and build a connected local library.
> Citation extraction is deterministic and format-sensitive; quality varies across PDFs and is being improved.

### 3) Projects: research workspaces
- Create projects and attach papers (a paper can belong to multiple projects)
- Project dashboard views:
  - paper list by project
  - reading queue stages: **TO_READ → SKIMMED → DEEP_READ → INTEGRATED**
  - project notes

**Why it helps:** keeps literature aligned with the research thread it supports, not just a global dump.

### 4) Lab-style sharing and collaboration
- Lightweight, local auth (name-based) with project membership
- Invite links to share a project
- Roles: **OWNER**, **EDITOR**, **COMMENTER**
- Shared docs inside projects (optionally linked to papers)
- Comments on docs
- Audit trail for key actions (member changes, doc updates, comments)

**Why it helps:** supports “Google-doc-like lab coordination” while keeping research structure intact and traceable.

### 5) Weekly todos (project planning)
- Simple todos per project with a due date picker (calendar)
- “This week” view to keep tasks focused
- Role-based editing

**Why it helps:** small, practical planning layer tied to project context—no separate tool required.

### 6) Discovery (search + tags + graph)
- Global search across papers, docs, todos, and citations
- Tags/concepts on papers and docs (autocomplete + filtering)
- Graph view inside a project: **Project ↔ Papers ↔ Tags** (optionally internal citation edges)

**Why it helps:** makes it fast to answer “where did we discuss this?” and “what papers relate to this concept?”

---

## Why not just use Notion / Drive / Zotero?

PaperVault is optimized for a specific gap:
- Zotero-like libraries are great for reference management but don’t naturally map to project workspaces, reading pipelines, and lab collaboration.
- Notion/Drive are flexible, but research workflows become inconsistent quickly (metadata formats drift, citations aren’t integrated, and paper context gets lost).

PaperVault stays minimal while remaining research-native:
- structured paper objects,
- deterministic extraction,
- project-oriented organization,
- collaboration features aligned to lab workflows.

---

## Demo Mode

Try PaperVault without installation via the live demo at `/demo/library`:

**What you'll see:**
- 8 sample papers from ML/Security conferences (NeurIPS, USENIX, etc.)
- 3 demo projects with notes and todos
- Full search functionality across papers, docs, and citations
- Graph visualization of paper relationships
- Read-only interface (no uploads, no modifications)

**Demo features:**
- ✅ Paper library browsing
- ✅ Paper detail pages with metadata, abstract, BibTeX
- ✅ Citations display
- ✅ Project organization
- ✅ Search across all content
- ✅ Tag filtering
- ❌ PDF uploads (read-only mode)
- ❌ Editing or modifications

**Technical note:** Demo mode uses static in-memory data (`src/demo/demo-data.ts`) and works without a database or backend. This makes it Netlify-deployable and perfect for trying PaperVault before installing locally.

---

## Status

PaperVault is actively evolving. The core paper library, projects, roles/sharing, docs/comments, and discovery workflows are in place. Citation extraction is present but format-sensitive and under ongoing refinement. If you wish to collaborate, please reach out to me
