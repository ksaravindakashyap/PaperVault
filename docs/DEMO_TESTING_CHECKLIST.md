# Demo Mode Testing Checklist

## Pre-Deployment Validation

### ✅ Local Development Tests

#### 1. Demo Routes Load Successfully
- [ ] Visit `http://localhost:3000/demo/library` → HTTP 200, papers table visible
- [ ] Visit `http://localhost:3000/demo/papers/demo-paper-1` → HTTP 200, paper details visible
- [ ] Visit `http://localhost:3000/demo/projects` → HTTP 200, projects list visible
- [ ] Visit `http://localhost:3000/demo/search?q=security` → HTTP 200, search results visible
- [ ] Visit `http://localhost:3000/demo/graphs` → HTTP 200, graph view visible

#### 2. Demo Banner & UI
- [ ] "Demo mode: read-only" banner visible at top of all demo pages
- [ ] "Download Software" button in banner links to `/download`
- [ ] "Exit Demo" button returns to landing page (`/`)
- [ ] Demo pages show read-only indicators in UI

#### 3. No Database/API Calls
Open browser DevTools Network tab:
- [ ] Visit `/demo/library` → No requests to `/api/me`
- [ ] Visit `/demo/library` → No requests to `/api/me/workspace`
- [ ] Visit `/demo/library` → No requests to `/api/papers`
- [ ] Visit `/demo/papers/demo-paper-1` → No API requests
- [ ] All data loads instantly (no loading spinners waiting for API)

#### 4. Demo Data Integrity
```bash
npm run smoke:demo
```
- [ ] ✅ Validates 8 papers with required fields
- [ ] ✅ Validates 3 projects
- [ ] ✅ Validates 10 tags
- [ ] ✅ Validates paper-tag relationships
- [ ] ✅ Exit code 0

#### 5. Netlify Safety Validation
```bash
npm run validate:demo-netlify
```
- [ ] ✅ No database imports in demo pages
- [ ] ✅ No file system imports in demo pages
- [ ] ✅ No Prisma client imports in demo pages
- [ ] ✅ No API fetch calls in demo pages
- [ ] ✅ Exit code 0

#### 6. Existing App Routes Still Work
- [ ] Visit `http://localhost:3000/library` → HTTP 200
- [ ] User init dialog appears (if no user exists)
- [ ] Workspace guard checks for workspace
- [ ] Can upload papers (mutation works)
- [ ] Can create projects (mutation works)
- [ ] Worker processes papers correctly

#### 7. Landing Page Links
- [ ] Landing page "View Demo" button → `/demo/library`
- [ ] Landing page "Download Software" button → `/download`
- [ ] Both CTAs (hero + final) link correctly

---

## Netlify Deployment Tests

### After deploying to Netlify:

#### 1. Demo Routes Accessible
- [ ] Visit `https://your-site.netlify.app/demo/library` → HTTP 200
- [ ] Demo library page loads with 8 sample papers
- [ ] No "Internal Server Error" or 500 responses
- [ ] Page loads in < 2 seconds

#### 2. Demo Navigation Works
- [ ] Click on any paper → Detail page loads
- [ ] Search for "security" → Results appear
- [ ] Navigate to Projects → List appears
- [ ] Navigate to Graph → Graph renders
- [ ] Back button works correctly
- [ ] All internal links stay within `/demo/*` scope

#### 3. Demo Data Persists
- [ ] Refresh page → Same papers visible
- [ ] Navigate away and back → Data still there
- [ ] No "data reset" warnings (data should appear static)

#### 4. No Backend Dependencies
- [ ] Demo pages load even if backend/DB is down
- [ ] No console errors about missing database
- [ ] No errors about missing Prisma client
- [ ] No 404s for worker endpoints

#### 5. Mobile Responsiveness
- [ ] Demo library renders correctly on mobile
- [ ] Demo banner visible on mobile
- [ ] Tables/cards stack properly on small screens
- [ ] Navigation accessible via mobile menu

#### 6. Performance
- [ ] Lighthouse score > 90 for demo pages
- [ ] No console warnings or errors
- [ ] Fast page transitions (client-side routing)
- [ ] No layout shift on load

---

## Edge Cases

### Demo Mode Isolation
- [ ] Demo routes don't affect main app data
- [ ] Main app routes don't affect demo mode
- [ ] Demo and app can coexist on same deployment
- [ ] Switching between demo and app works seamlessly

### Error Handling
- [ ] Invalid demo paper ID → Shows "Paper not found" (not crash)
- [ ] Invalid demo project ID → Shows appropriate message
- [ ] Empty search query → Shows "Enter a search query" message
- [ ] Non-existent demo route → 404 page (handled by Next.js)

### Browser Compatibility
- [ ] Demo works in Chrome
- [ ] Demo works in Firefox
- [ ] Demo works in Safari
- [ ] Demo works in Edge

---

## Rollback Plan

If demo mode fails on Netlify:

1. **Immediate**: Remove demo links from landing page
2. **Short-term**: Debug using Netlify function logs
3. **Long-term**: Consider separate static export for demo

Common issues and fixes:
- **500 errors**: Check for Prisma imports → Run `npm run validate:demo-netlify`
- **404s**: Verify Next.js build includes demo routes → Check `.next` build output
- **Slow loads**: Ensure demo-data.ts is < 1MB → Check bundle size
- **Hydration errors**: Ensure demo pages are client components → Check `"use client"` directive

---

## Success Metrics

✅ **Demo is successful if:**
1. All demo routes return HTTP 200 on Netlify
2. No database/FS dependencies in demo code
3. Demo loads in < 2 seconds
4. No console errors in browser DevTools
5. Users can explore 8 sample papers
6. Landing page CTAs work correctly
7. Existing app functionality unchanged

❌ **Demo needs fixing if:**
1. Any demo route returns 500 error
2. Database connection errors in logs
3. Demo pages don't load on Netlify
4. Console shows Prisma errors
5. Demo breaks existing app routes
