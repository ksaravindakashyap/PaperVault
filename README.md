# PaperVault

PaperVault is an AI-powered research workspace for academics. It combines a structured paper library with semantic search, reading workflow tools, and LLM-powered analysis to reduce friction from "I found a paper" to "this is in my lit review."

---

## What it does

### Paper library
- Upload PDFs and extract metadata (title, authors, year, abstract, DOI, arXiv ID)
- Generate BibTeX entries with one-click copy
- Extract references per paper and link them to other papers in your library
- Full-text search across papers, docs, todos, and citations

### AI Search
- Search 100M+ papers from Semantic Scholar with a natural language query
- Query type detection: short exact-match queries skip the LLM and do a direct title lookup; exploratory queries decompose through an LLM
- Cache-first: if enough relevant papers exist in the local vector cache, the Semantic Scholar API is skipped entirely
- Year range filters and venue filters
- Add any search result directly to your library with one click

### Reading Queue (kanban board)
- Track papers through five stages: Inbox, To Read, Skimmed, Deep Read, Integrated
- Drag-free progression with prev/next column buttons
- Optimistic UI updates

### What to Read Next
- pgvector cosine similarity between your Deep Read + Integrated papers and your To Read pile
- Recommends the most topically relevant papers to tackle next
- Appears automatically in the Reading Queue board view

### Cross-paper Synthesis
- Select 2 to 5 papers from your library
- LLM generates a 180 to 250 word synthesis paragraph covering shared findings, contradictions, and methodological differences
- Ready to paste into a literature review

### Research Gap Finder
- Describe your research direction in plain text
- System embeds the query, retrieves your most relevant library papers, and fetches recent external papers not in your library
- LLM identifies 3 to 4 named research gaps with descriptions and specific paper suggestions
- Add suggested papers to your library directly from the dialog

### Projects and collaboration
- Group papers into research projects
- Per-project docs, notes, todos, and shared commenting
- Role-based access: Owner, Editor, Commenter
- Audit trail for key actions

### Citation graph
- Visual graph of paper relationships within a project
- Paper to tag connections and internal citation edges

---

## Stack

- **Frontend:** Next.js 15 (App Router), Tailwind CSS, shadcn/ui, Framer Motion
- **Database:** PostgreSQL on Neon with pgvector (1024-dim embeddings)
- **LLM:** stepfun-ai/step-3.5-flash via Nvidia NIM (query decomposition, synthesis, gap analysis)
- **Embeddings:** nvidia/nv-embedqa-e5-v5 (asymmetric: passage/query input types)
- **Paper data:** Semantic Scholar API

---

## Who it is for

- Graduate students building literature reviews
- Lab groups sharing papers and project context
- ML / NLP / Security researchers who want structured organization without heavy tooling
- Anyone whose current workflow is PDFs in folders, scattered Google Docs, and a messy BibTeX file

---

## Status

Actively developed. Core library, AI search, reading queue, recommendations, synthesis, and gap finder are all functional. Citation extraction quality varies across PDF formats and is being refined.

To collaborate or give feedback, reach out on LinkedIn: linkedin.com/in/ksaravindakashyap
