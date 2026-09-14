# Contributing to SANAD

Thank you for your interest in contributing to SANAD! This document provides guidelines and information for contributors.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a professional environment

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch from `main`
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Sanad.git
cd Sanad

# Install dependencies
cd app
npm install

# Start development server
npm run dev
```

## Branch Naming

Use descriptive branch names:

- `feature/add-bulk-import` — New features
- `fix/resolve-login-redirect` — Bug fixes
- `docs/update-readme` — Documentation
- `refactor/optimize-queries` — Code improvements

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add bulk customer import
fix: resolve redirect loop on login
docs: update API reference
refactor: simplify permission checks
test: add E2E tests for factory code
```

## Code Style

- **TypeScript** — Strict mode, no `any` types
- **React** — Functional components with hooks
- **CSS** — Tailwind utility classes, use existing design tokens
- **Naming** — `camelCase` for variables/functions, `PascalCase` for components
- **Files** — `PascalCase.tsx` for components, `camelCase.ts` for utilities

### Design Tokens

Use the custom Tailwind colors defined in `tailwind.config.js`:

- `brand-*` — Primary UI palette
- `sand-*` — Warm background tones
- `status-*` — Status-specific colors (progress, completed, cancelled, archived)

### CSS Classes

Use pre-defined utility classes from `globals.css`:

- `card` — Card containers
- `btn-primary`, `btn-secondary`, `btn-danger`, `btn-ghost` — Buttons
- `input-field`, `select-field`, `label-field` — Form elements
- `status-badge` — Status indicators

## Testing

### Unit Tests

```bash
npm run test          # Run once
npm run test:watch    # Watch mode
```

### E2E Tests

```bash
npx playwright test                    # Headless
npx playwright test --headed           # With browser
npx playwright test -g "dashboard"     # Specific test
```

### Before Submitting

1. Run `npm run typecheck` — No TypeScript errors
2. Run `npm run test` — All unit tests pass
3. Run `npx playwright test` — All E2E tests pass
4. Verify your changes work in both English and Arabic

## Pull Request Guidelines

- **One feature per PR** — Keep changes focused
- **Describe what and why** — Not just how
- **Include screenshots** — For UI changes
- **Update documentation** — If adding/changing features
- **Add tests** — For new functionality
- **Keep commits clean** — Squash WIP commits before submitting

## Project Structure

```
app/
├── src/
│   ├── components/    # Reusable UI (common/, layout/, auth/)
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Services, auth, Supabase
│   ├── pages/         # Page components (one per route)
│   ├── types/         # TypeScript types
│   └── styles/        # CSS utilities
├── e2e/               # Playwright tests
└── docs/              # Product specifications
```

## Key Conventions

### Bilingual Support

Every user-visible string uses `t('English', 'عربي')` from `useLanguage()`. Never leave one blank.

### Company Isolation

All data is filtered by `currentCompany.id`. Never mix data between companies.

### Modal Pattern

Create and Edit use the same form modal: `<XFormModal open onClose onSave entity? />`.

### Document Types

`QUOT` | `PINV` | `TINV` | `CINV` | `PKL` | `DN` | `BL`

## Questions?

Open an issue with the label `question` or start a discussion.
