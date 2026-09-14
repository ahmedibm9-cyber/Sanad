# SANAD — Agent Instructions

## What this is

Self-hosted export/shipping operations web app. Arabic RTL + English LTR. Currently a **static UI prototype** — no backend, no Supabase, no R2, no real auth yet.

## Repo layout

```
SANAD/
├── app/                    # Frontend application (React + Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components (common/, layout/, customers/, projects/, etc.)
│   │   ├── contexts/       # React contexts (Language, Company, App)
│   │   ├── data/           # Mock data (mockData.ts) — single source of truth for prototype
│   │   ├── pages/          # 19 page components (one per route)
│   │   ├── styles/         # Tailwind + custom CSS utility classes
│   │   ├── types/          # TypeScript type definitions
│   │   ├── App.tsx         # Router (react-router-dom v6)
│   │   └── main.tsx        # Entry point
│   ├── package.json
│   ├── vite.config.ts      # Has @/ path alias
│   ├── tailwind.config.js  # Custom colors: brand-*, sand-*, status-*
│   └── tsconfig.json       # Strict mode, noUnusedLocals/Parameters OFF
└── docs/                   # Product specs (29 files) — READ THESE FIRST for any feature work
    ├── 00_MASTER_PRODUCT_SPEC.md   # Authoritative product definition
    ├── 02_AI_CODING_AGENT_INSTRUCTIONS.md  # Coding rules
    └── ...
```

## Commands

```bash
cd app
npm install          # Install deps
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # tsc -b && vite build
npx tsc --noEmit     # Type-check only (fast)
```

No test suite exists yet. No lint config beyond TypeScript strict mode.

## Key conventions

### CSS classes (defined in `globals.css`)
Use these, not raw Tailwind for common patterns: `card`, `btn-primary`, `btn-secondary`, `btn-danger`, `btn-ghost`, `input-field`, `select-field`, `label-field`, `status-badge`.

### Custom Tailwind colors
- `brand-*` (50–900): Primary UI blue/gray palette
- `sand-*` (50–900): Warm beige background tones
- `status-progress/completed/cancelled/archived`: Status-specific colors

### Fonts
Inter (Latin) + Noto Sans Arabic. The `font-arabic` class activates Arabic font. Language switching via `useLanguage()` context flips `dir` between `ltr` and `rtl`.

### Bilingual support
Every user-visible string uses `t('English', 'عربي')` from `useLanguage()`. Both strings are always present — never leave one blank.

### Company isolation
Mock data is filtered by `currentCompany.id` via helpers like `getProjectsByCompany()`, `getCustomersByCompany()`. The `useCompany()` context provides `currentCompany`. Never mix data between companies.

### Modal/form pattern
Create and Edit use the same form modal component: `<XFormModal open onClose onSave entity? />`. State pattern: `const [showForm, setShowForm] = useState(false)` + `const [editing, setEditing] = useState(null)`.

### Document types
`QUOT` | `PINV` | `TINV` | `CINV` | `PKL` | `DN` | `BL` — defined in types, labels in page files.

### Shared components
- `Modal` (common/Modal.tsx) — sizes: sm/md/lg/xl/full. Accepts `footer` prop.
- `ConfirmModal` (common/ConfirmModal.tsx) — variants: danger/warning/info/restore.
- `FormSection` (common/FormSection.tsx) — collapsible form section.
- `AttachmentUploadModal` (common/AttachmentUploadModal.tsx) — file upload mock.

## Product rules (non-negotiable)

From `docs/README.md` and `docs/02_AI_CODING_AGENT_INSTRUCTIONS.md`:

- Company data must never mix between companies
- Shared Data changes must never propagate silently to documents
- No hard-delete in normal UI (use Trash)
- No rasterized PDF generation
- Critical permission changes require confirmation
- Factory Code updates must never delete historical records
- Document numbers are user-entered, unique per company, not auto-generated

## Current status

Static UI prototype phase. All data is mock/frontend state. No Supabase, Cloudflare R2, real auth, real licensing, or production PDF generation.

## Docs authority

If two specs conflict: explicit PO decision > `00_MASTER_PRODUCT_SPEC.md` > specialist spec > `21_ASSUMPTIONS_DEFAULTS.md`.
