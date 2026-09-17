# SANAD UI/UX & Accessibility Audit Report

**Date:** 2026-09-17  
**URL:** https://sanad-9iudv9yuw-ibmai1979-2318.vercel.app  
**Auditor:** Playwright automated + manual inspection  
**Target:** WCAG 2.2 AA (partial), UI consistency, RTL correctness

---

## Executive Summary

The SANAD app is a functional static UI prototype with solid foundations: proper semantic HTML labels on login, RTL layout mirroring works, sidebar collapses on mobile, and most pages have consistent patterns. However, there are **14 actionable issues** across accessibility, localization, and UX consistency.

| Severity | Count |
|----------|-------|
| Critical (A11y blocker) | 3 |
| Major | 5 |
| Minor | 6 |

---

## 1. Login Flow (`app/src/pages/LoginPage.tsx`)

### ✅ What Works
- `<label htmlFor>` correctly associated with inputs (line 70, 89)
- `required` attribute on both inputs (line 80, 99)
- `aria-label` on show/hide password toggle (line 107)
- `autoComplete` attributes set (line 81, 100)
- Error message displayed on invalid credentials (line 60-64)
- Focus management: `autoFocus` on email (line 82)

### ❌ Issues

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 1 | **Critical** | Error message `<div>` lacks `role="alert"` — screen readers won't announce it | `LoginPage.tsx:61` |
| 2 | Major | No `aria-invalid` or `aria-describedby` on inputs when error is shown — no programmatic link between error and field | `LoginPage.tsx:73-83, 92-101` |
| 3 | Minor | "Sign In" button text not translated via `t()` — hardcoded English | `LoginPage.tsx:126` |

---

## 2. Dashboard (`app/src/pages/Dashboard.tsx`)

### ✅ What Works
- Proper heading hierarchy: h1 → h2
- Stat cards are clickable links with hover states
- Empty state for "My To-dos" and "Recent Documents"
- Priority badges have color + text (not color-only)

### ❌ Issues

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 4 | **Critical** | Activity log displays raw UUID (`actor_user_id`) instead of user name — unusable for end users | `Dashboard.tsx:375` |
| 5 | Major | `toLocaleDateString('en-US', ...)` hardcoded — dates won't localize in Arabic mode | `Dashboard.tsx:263, 324, 382` |
| 6 | Minor | Activity emojis (➕, ✏️, etc.) used as icons — not accessible, no text alternative | `Dashboard.tsx:356-369` |

---

## 3. Navigation & Sidebar

### ✅ What Works
- `<nav aria-label="Main navigation">` properly labeled
- Sidebar collapses to icons on mobile (375px) — tested
- Active link state visible
- Keyboard navigation: Tab moves through sidebar links

### ❌ Issues

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 7 | Major | Sidebar section headings ("Work", "Data", etc.) are `<p>` not `<h3>` — breaks heading hierarchy for screen readers | Sidebar component |
| 8 | Minor | "Updated" company switcher button shows just "U" avatar — unclear for keyboard-only users | Sidebar top |

---

## 4. RTL / Arabic

### ✅ What Works
- Sidebar correctly mirrors to right side
- Main content shifts to left
- Navigation labels translate to Arabic
- Stat cards reorder correctly
- Language toggle shows "AR" / "EN"

### ❌ Issues

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 9 | Major | Todo item titles, descriptions, and activity descriptions remain in English even in Arabic mode — content is not translated via `t()` | `Dashboard.tsx:252, 255, 375-379` |
| 10 | Minor | Dates format (`Sep 17`) not localized — should use Arabic month names | `Dashboard.tsx:263, 382` |

---

## 5. Projects Page (`app/src/pages/ProjectsPage.tsx`)

### ✅ What Works
- Search input with placeholder
- Status filter button
- Customer dropdown filter
- Empty state "No projects found"
- "New Project" CTA button

### ❌ Issues

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 11 | Minor | Customer filter `<select>` lacks visible `<label>` — only has placeholder "All Customers" | Projects filter bar |

---

## 6. Tasks Page

### ✅ What Works
- Same consistent pattern as Projects
- "Convert to Project" + "New Task" buttons
- Customer filter with options

### ❌ Issues
- Same minor label issue as Projects (shared component pattern)

---

## 7. Customers / Materials / Factory Code Pages

### ✅ What Works
- Consistent table + search + create pattern
- Empty states present

### ❌ Issues
- Factory Code page has search and import — functional

---

## 8. Todos Page

### ✅ What Works
- Inline create form
- Todo list with checkboxes
- Priority and due date display

---

## 9. Settings Page (`app/src/pages/SettingsPage.tsx`)

### ✅ What Works
- Tabbed navigation for settings sections
- Form fields with labels
- Upload areas with clear instructions
- "Save Changes" button

### ❌ Issues

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 12 | Minor | Settings tab navigation uses `<button>` but no `role="tablist"` / `role="tab"` / `aria-selected` — not accessible as tabs | Settings nav |

---

## 10. Mobile Responsive (375px)

### ✅ What Works
- Sidebar collapses to 68px icon rail
- Stat cards stack vertically
- Main content fills remaining width
- Header bar condenses

### ❌ Issues

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 13 | Major | Todo item text truncated to ~64px width — nearly unreadable on mobile | Dashboard mobile view |
| 14 | Minor | No hamburger menu to expand sidebar on mobile — only expand button visible | Mobile sidebar |

---

## 11. Accessibility Summary

### Keyboard Navigation
- ✅ Tab order follows logical flow on login page
- ✅ Sidebar links are focusable
- ⚠️ Focus indicators not visually verified (no `:focus-visible` test performed)
- ❌ No skip-to-content link
- ❌ Modal dialogs (when opened) need focus trap verification

### ARIA & Semantics
- ✅ `<nav>` with labels
- ✅ Form labels with `htmlFor`
- ✅ `aria-label` on icon-only buttons (show password, collapse sidebar)
- ❌ Error messages lack `role="alert"`
- ❌ Tab navigation lacks ARIA tab pattern
- ❌ Activity emojis lack text alternatives

### Color & Contrast
- ✅ Status badges use color + text (not color-only)
- ✅ Text appears to meet 4.5:1 contrast ratio (visual inspection)

---

## Priority Fixes

### P0 — Must Fix (Accessibility Blockers)
1. Add `role="alert"` to login error message (`LoginPage.tsx:61`)
2. Resolve `actor_user_id` UUID to display name in activity log (`Dashboard.tsx:375`)
3. Add `aria-invalid` + `aria-describedby` to login inputs on error

### P1 — Should Fix (Major UX)
4. Localize dates via `t()` or locale-aware formatting
5. Translate todo content and activity descriptions in Arabic mode
6. Fix mobile todo text truncation
7. Use semantic heading hierarchy in sidebar
8. Add ARIA tab pattern to Settings navigation

### P2 — Nice to Have (Minor)
9. Translate "Sign In" button text
10. Add visible labels to filter dropdowns
11. Replace emoji icons with accessible SVG alternatives
12. Add skip-to-content link

---

## Files Referenced

| File | Lines | Issues |
|------|-------|--------|
| `app/src/pages/LoginPage.tsx` | 61, 73-83, 92-101, 126 | Error role, aria-invalid, button text |
| `app/src/pages/Dashboard.tsx` | 252, 255, 263, 324, 356-369, 375, 382 | UUID display, localization, emojis |
| `app/src/pages/ActivityPage.tsx` | 49 | UUID comment, no user name resolution |
| `app/src/pages/SettingsPage.tsx` | Nav section | Missing ARIA tab pattern |
| Sidebar component | Section headings | `<p>` instead of `<h3>` |

---

*Audit screenshots saved in `D:\SANAD\audit\` directory.*
