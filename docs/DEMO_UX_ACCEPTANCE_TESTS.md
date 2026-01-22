# Demo UX - Acceptance Test Checklist

Run these tests to verify all demo UX improvements are working correctly.

---

## ✅ Pre-Test Setup

```bash
# 1. Start dev server
npm run dev
# Note the port (usually 3000 or 3002)

# 2. Run validation scripts
npm run validate:demo-netlify  # Should pass
npm run smoke:demo            # Should pass

# 3. Open browser to http://localhost:3000 (or 3002)
```

---

## A) Graph Visualization Tests

### Test 1: Project Cards Page
**URL**: `http://localhost:3000/demo/graphs`

**Steps**:
1. Navigate to demo graphs page
2. Verify 3 project cards visible:
   - Web Agent Security Research
   - Neural Scaling Laws  
   - Privacy-Preserving ML
3. Each card shows paper count and tag count
4. "Demo mode: read-only" badge visible at top

**Expected**: ✅ All 3 cards render, counts are accurate

---

### Test 2: Graph Visualization - Basic Rendering
**URL**: `http://localhost:3000/demo/graphs` → Click "Web Agent Security Research"

**Steps**:
1. Click on "Web Agent Security Research" card
2. Wait for graph to load (should be immediate)
3. Verify graph elements:
   - Orange project node in center
   - Paper nodes (white) around project
   - Tag nodes (orange/tan) on outer ring
   - Lines/edges connecting nodes
4. Verify controls visible:
   - Zoom in/out buttons
   - Fit view button
   - Mini-map in corner

**Expected**: ✅ ReactFlow graph renders with nodes, edges, controls, minimap

---

### Test 3: Graph Interactions - Pan & Zoom
**URL**: Continue from Test 2

**Steps**:
1. Try to drag the canvas (pan) - SHOULD WORK
2. Try mouse wheel zoom - SHOULD WORK
3. Click zoom in (+) button - SHOULD WORK
4. Click zoom out (-) button - SHOULD WORK
5. Click fit view button - SHOULD WORK
6. Try to drag a node - SHOULD NOT WORK (read-only)

**Expected**: ✅ Pan/zoom work, node dragging disabled

---

### Test 4: Graph Interactions - Node Click & Side Panel
**URL**: Continue from Test 2

**Steps**:
1. Click on a paper node (white rectangle)
2. Side panel slides in from right
3. Verify panel content:
   - Shows "Type: paper"
   - Shows paper title
   - Shows venue type
   - Shows year
   - Shows status
   - "Open Paper" button visible
4. Click "Open Paper" button
5. Verify navigates to `/demo/papers/[id]`
6. Go back to graph
7. Click on the project node (orange)
8. Verify side panel shows project details
9. Click X to close side panel

**Expected**: ✅ Side panel works, navigation works, close works

---

### Test 5: Graph - Other Projects
**Steps**:
1. Go back to `/demo/graphs`
2. Click "Neural Scaling Laws" project
3. Verify graph renders with different papers
4. Click "Privacy-Preserving ML" project
5. Verify graph renders

**Expected**: ✅ Each project shows its own graph with correct papers/tags

---

## B) Project Dashboard Tests

### Test 6: Project Tabs - Papers
**URL**: `http://localhost:3000/demo/projects/demo-project-1`

**Steps**:
1. Navigate to project page
2. Verify "Papers" tab is selected by default
3. Verify tab list shows:
   - Papers (count)
   - Reading Queue
   - Notes
   - Todos (count)
4. Verify papers table shows:
   - Title column (clickable links)
   - Venue column
   - Year column
   - Status column (badges)
5. Click a paper link - navigates to paper page

**Expected**: ✅ Papers tab shows table with all papers, links work

---

### Test 7: Project Tabs - Reading Queue
**URL**: Continue from Test 6

**Steps**:
1. Click "Reading Queue" tab
2. Verify sections visible:
   - TO READ (count)
   - SKIMMED (count)
   - DEEP READ (count)
   - INTEGRATED (count)
3. Each section shows papers with:
   - Paper title (clickable)
   - Author snippet
   - Year
   - Status badge (grayed out, not editable)
4. Try clicking status badge - SHOULD NOT OPEN dropdown (read-only)
5. Hover over status badge - tooltip says "Demo mode: status changes disabled"

**Expected**: ✅ Reading queue shows papers by status, status is read-only

---

### Test 8: Project Tabs - Notes
**URL**: Continue from Test 6

**Steps**:
1. Click "Notes" tab
2. Verify content:
   - Header says "Project Notes"
   - Label says "Read-only in demo mode"
   - Notes content displayed OR
   - Placeholder text if no notes
3. Try clicking in notes area - SHOULD NOT be editable
4. No "Save" button visible

**Expected**: ✅ Notes tab shows content, clearly read-only

---

### Test 9: Project Tabs - Todos & Toggles
**URL**: Continue from Test 6

**Steps**:
1. Click "Todos" tab
2. Verify header shows:
   - "Todos" title
   - "This Week" button
   - "All Time" button (selected by default)
3. Verify todos list shows all todos with:
   - Title
   - Notes (if any)
   - Due date
   - Status badge (OPEN or DONE)
4. Click "This Week" button
5. Verify list filters to only show todos due within 7 days
6. Click "All Time" button
7. Verify list shows all todos again

**Expected**: ✅ Todos tab shows todos, filter toggles work client-side

---

### Test 10: Graph Button in Project Header
**URL**: Continue from Test 6

**Steps**:
1. Look at top-right of project page
2. Verify "Graph" button visible next to "Demo mode" badge
3. Click "Graph" button
4. Verify navigates to `/demo/projects/[id]/graph`
5. Verify ReactFlow graph renders

**Expected**: ✅ Graph button navigates to graph visualization

---

## C) Landing Page Tests

### Test 11: Desktop Software Section
**URL**: `http://localhost:3000/`

**Steps**:
1. Navigate to landing page
2. Scroll down past hero, features, "How it works"
3. Verify "Desktop software coming soon" section visible
4. Section should have:
   - Desktop/laptop icon
   - "Desktop software coming soon" heading
   - "In Development" badge (orange)
   - Description about native app
   - Three bullet points:
     - Local-first architecture
     - Built-in PDF viewer
     - Enhanced performance
5. Verify NO "Step 3" or "Step 4" labels anywhere
6. Verify NO "Collaboration for labs" title

**Expected**: ✅ Desktop section visible, no step labels, correct content

---

### Test 12: View Demo Links
**URL**: Continue from Test 11

**Steps**:
1. Find "View Demo" button in hero section
2. Verify button exists and is visible
3. Click "View Demo" button
4. Verify navigates to `/demo/library`
5. Go back to landing page
6. Scroll to bottom CTA section
7. Find second "View Demo" button
8. Click it
9. Verify navigates to `/demo/library`

**Expected**: ✅ Both "View Demo" buttons navigate to `/demo/library`

---

## D) Read-Only Enforcement Tests

### Test 13: No Mutation Buttons in Demo
**URLs**: Various demo pages

**Steps**:
1. Visit `/demo/library`
   - NO "Upload Paper" button visible
2. Visit `/demo/projects`
   - NO "Create Project" button visible
3. Visit `/demo/projects/demo-project-1`
   - NO "Edit" button visible
   - NO "Delete" button visible
   - NO "Add Papers" button visible
4. Visit `/demo/papers/demo-paper-1`
   - NO "Delete" button visible
   - NO "Edit" or "Reprocess" buttons visible

**Expected**: ✅ No mutation buttons visible in any demo page

---

### Test 14: Demo Mode Badges
**URLs**: Various demo pages

**Steps**:
1. Visit each demo page and verify orange "Demo mode: read-only" badge visible:
   - `/demo/library` ✓
   - `/demo/graphs` ✓
   - `/demo/projects` ✓
   - `/demo/projects/[id]` ✓
   - `/demo/projects/[id]/graph` ✓
   - `/demo/papers/[id]` ✓
   - `/demo/search` ✓

**Expected**: ✅ Badge visible on all demo pages

---

## E) Browser Console Tests

### Test 15: No JavaScript Errors
**Steps**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Visit each demo route:
   - `/demo/graphs`
   - `/demo/projects/demo-project-1`
   - `/demo/projects/demo-project-1/graph`
   - `/demo/library`
   - `/demo/papers/demo-paper-1`
4. Check console for errors

**Expected**: ✅ No React errors, no 404s, no unhandled exceptions

---

### Test 16: No Network Errors
**Steps**:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Visit `/demo/projects/demo-project-1/graph`
4. Verify:
   - No failed requests (red in network tab)
   - No 500 errors
   - No requests to `/api/graph` (demo uses local data)

**Expected**: ✅ No network errors, no API calls

---

## F) Netlify Readiness Tests

### Test 17: Build Test
**Steps**:
```bash
npm run build
```

**Expected**: ✅ Build completes without errors

---

### Test 18: Validation Scripts
**Steps**:
```bash
npm run validate:demo-netlify
npm run smoke:demo
```

**Expected**: ✅ Both scripts pass all checks

---

### Test 19: Static Analysis
**Steps**:
```bash
# Search for database imports in demo files
grep -r "from.*@/lib/db" src/app/demo/
# Should return: no matches

# Search for fs imports in demo files  
grep -r "from.*['\"]fs['\"]" src/app/demo/
# Should return: no matches
```

**Expected**: ✅ No forbidden imports found

---

## G) Accessibility Tests

### Test 20: Keyboard Navigation
**Steps**:
1. Visit `/demo/projects/demo-project-1/graph`
2. Press Tab key multiple times
3. Verify can navigate to:
   - "Back to Project" link
   - Graph controls (zoom buttons)
4. Press Enter on focused elements - they activate

**Expected**: ✅ Basic keyboard navigation works

---

### Test 21: Screen Reader Labels
**Steps**:
1. Inspect graph controls with DevTools
2. Verify buttons have aria-labels or visible text
3. Check side panel has proper heading structure

**Expected**: ✅ Basic accessibility attributes present

---

## Summary Checklist

After running all tests, verify:

- [ ] Graph visualization renders correctly (ReactFlow)
- [ ] Graph is interactive (pan/zoom) but read-only (no drag)
- [ ] All 4 project tabs work (Papers, Reading Queue, Notes, Todos)
- [ ] Todos filter toggles work (This Week / All Time)
- [ ] Landing page shows desktop section (no step roadmap)
- [ ] No mutation buttons visible in demo
- [ ] Demo mode badges visible on all pages
- [ ] No JavaScript console errors
- [ ] No network errors or failed requests
- [ ] Build completes successfully
- [ ] Validation scripts pass

**If all checked**: ✅ Demo UX improvements are complete and working!

**If any fail**: Review `docs/DEMO_UX_FIX.md` for troubleshooting steps.

---

## Quick Smoke Test (5 minutes)

If you don't have time for full tests, run this quick check:

1. ✅ Visit `/demo/graphs` → Click project → Graph renders
2. ✅ Visit `/demo/projects/demo-project-1` → All 4 tabs exist
3. ✅ Landing page → "Desktop software coming soon" section visible
4. ✅ No console errors
5. ✅ `npm run build` succeeds

**All 5 pass?** Ready to deploy! 🚀
