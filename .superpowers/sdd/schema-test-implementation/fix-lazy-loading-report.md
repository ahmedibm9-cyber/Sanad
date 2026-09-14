# Fix Lazy Loading Report

## Problem

Two blocking issues in `app/src/App.tsx`:

1. **No route-level lazy loading** — All 19 page components were eagerly imported via static `import` statements.
2. **2 MB main bundle** — Because every page's code was statically imported, the main bundle was 2,052 KB, loading all page code upfront regardless of which route the user visited.

## Solution

Modified `app/src/App.tsx`:

- Converted all 19 page imports from static `import` to `React.lazy(() => import('./pages/...'))`.
- Wrapped `<Routes>` in a `<Suspense>` boundary with a `<PageSpinner />` fallback component.
- The fallback is a centered spinner using Tailwind's `animate-spin` with brand color classes.

## Verification

### TypeScript

```
npx tsc --noEmit  →  ✅ No errors
```

### Bundle Size

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Main bundle (`index-*.js`) | 2,052 KB | 948 KB | **-54%** |

Page code is now split into 20 separate chunk files (19 pages + shared modules), loaded on demand per route.

### Commit

```
8ca4642 fix: add route-level lazy loading to split 2MB bundle
```

## Files Changed

- `app/src/App.tsx` — Lazy imports + Suspense boundary + PageSpinner component
