# Demo Mode

PaperVault supports a public demo mode that works without a database or filesystem, making it suitable for static hosting (e.g., Netlify).

## How It Works

Demo mode is enabled when users navigate to routes under `/demo/*`. These routes use a static dataset (`src/demo/demo-data.ts`) instead of Prisma queries.

## Features

- **Read-only**: All mutation actions (upload, edit, delete, etc.) are disabled in demo mode
- **Static data**: Demo data is defined in `src/demo/demo-data.ts`
- **Full UI**: Demo pages mirror the main app's UI for consistency
- **No dependencies**: Works without database, filesystem, or external APIs

## Adding Demo Papers

To add more papers to the demo dataset, edit `src/demo/demo-data.ts`:

1. Add a new paper object to the `papers` array
2. Optionally add tags via `paperTags` array
3. Optionally add citations via `citations` array
4. Optionally link papers to projects via project `paperIds`

Example:

```typescript
{
  id: "demo-paper-9",
  title: "Your Paper Title",
  authors: "Author Name",
  year: 2024,
  venueType: "NEURIPS",
  status: "READY",
  abstract: "Paper abstract...",
  createdAt: "2025-01-20T10:00:00Z",
  updatedAt: "2025-01-20T10:00:00Z",
}
```

## Demo Routes

- `/demo/library` - Library view with demo papers
- `/demo/projects` - Projects list
- `/demo/projects/[id]` - Project detail with papers/docs/todos
- `/demo/papers/[id]` - Paper detail view
- `/demo/docs/[id]` - Doc detail view
- `/demo/search` - Search across demo data
- `/demo/graphs` - Graph visualization (project list)
- `/demo/projects/[id]/graph` - Project-specific graph

## Demo Banner

All demo pages show a banner at the top indicating demo mode with:
- "Demo mode • Read-only • Data resets"
- "Exit Demo" button (returns to landing page)
- "Download Software" button (links to `/download`)

## Data Provider

The demo uses a React context provider (`DemoProvider`) that exposes read-only methods:
- `getPapers()`, `getPaper(id)`
- `getProjects()`, `getProject(id)`
- `getDocs(projectId?)`, `getDoc(id)`
- `getTodos(projectId?)`, `getTodo(id)`
- `getTags()`, `getPaperTags(paperId)`, `getDocTags(docId)`
- `getCitations(paperId)`
- `search(query, types?)`

These methods read from the static `demoData` object instead of making API calls.
