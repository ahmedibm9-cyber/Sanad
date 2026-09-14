# Changelog

All notable changes to SANAD will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-09-08

### Added

- **Dashboard** — Welcome overview with stat cards, recent documents, activity feed, project status
- **Projects** — Full CRUD with status tracking, search, pagination, detail pages with tabs
- **Tasks** — Task creation, assignment, status filters, project linking
- **To-dos** — Personal task management with priority levels and completion toggle
- **Customers** — Customer directory with detail pages and project history
- **Materials Library** — Material catalog with grade, manufacturer, specifications
- **Factory Code** — Factory code database with search, import/export
- **Documents** — 7 document types (Quotation, Proforma Invoice, Tax Invoice, Commercial Invoice, Packing List, Delivery Note, Bill of Lading)
- **Reports** — Analytics by status, date, customer, tasks, overdue, documents, user activity
- **Activity & Audit** — Full audit trail with action type filters
- **Trash & Restore** — Soft delete with restore confirmation
- **Users & Permissions** — 81 granular permissions across 14 groups
- **Settings** — Company identity, legal, banking, document defaults, notifications, backup, licensing
- **Language Switching** — Full Arabic RTL / English LTR with instant toggle
- **Global Search** — Command palette (⌘K) with cross-module search
- **Notifications** — In-app notification system with mark-all-read

### Infrastructure

- Supabase backend with PostgreSQL and RLS
- Vercel deployment with SPA routing
- GitHub Actions CI (typecheck, test, build, E2E)
- 122 Playwright E2E tests covering all modules
- Vitest unit test setup

### Database

- Multi-company support with data isolation
- RLS policies with `SECURITY DEFINER` helper functions
- Auth user management via Supabase Auth
- Activity logging for audit trail
- Soft delete with trash/restore
