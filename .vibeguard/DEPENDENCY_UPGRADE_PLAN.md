# Dependency Upgrade Plan

## Objective

Remove the Critical and High vulnerabilities reported by `npm audit` while preserving the React/Vite application behavior and Factory Code XLSX compatibility.

## Baseline

- Node.js: `v24.20.0`
- npm: `11.19.0`
- `npm ci`, typecheck, tests, and build pass.
- `npm run lint` fails because ESLint is absent.
- Audit findings: Vitest Critical; Vite High; SheetJS `xlsx` High; five Moderate findings transitively related to the same toolchain.

## Dependency Inventory

| Package | Current | Candidate | Reason | Compatibility work |
| --- | --- | --- | --- | --- |
| `eslint` and React/TS plugins | absent | ESLint 10 toolchain | Make the declared lint gate executable. | Add flat config, fix valid lint findings only. |
| `vite` | 5.4.21 resolved | 8.3.0 selected | Removes the reported Vite advisory chain. | Review Vite 6/7/8 migration notes; test build and dev behavior. |
| `@vitejs/plugin-react` | 4.7.0 resolved | 6.1.1 selected | Required Vite 8 peer compatibility. | Verify JSX transform and test configuration. |
| `vitest` | 2.1.9 resolved | 4.1.11 selected | Removes the reported Vitest advisory chain without the Vitest 5 behavioral changes. | Verify all tests and coverage. |
| `xlsx` | 0.18.5 | `@e965/xlsx@0.20.3` selected | No patched npm release for reported advisories. | Preserve import parsing and export formatting with fixture tests. |
| `exceljs` | absent | rejected | Current release adds an unpatched Moderate `uuid` advisory and deprecated transitive dependencies. | Do not adopt. |

## Stages

1. Add ESLint and flat configuration without changing application behavior.
2. Create XLSX compatibility fixtures/tests against current behavior.
3. Replace `xlsx` with the selected supported library after the fixture spike.
4. Upgrade Vite, plugin-react, and Vitest together after reviewing migration changes.
5. Run audit, typecheck, lint, unit/integration tests, build, and browser smoke checks.

## Known Compatibility Risks

- Vite 8 changes bundler/tooling internals; this project has a custom Vite security-header plugin and dynamic imports to validate.
- Vitest 5 requires Vite 6.4+ and Node 22.12+, which the current Node runtime satisfies. Nested `vi.mock` usage must be audited because Vitest 5 rejects it.
- `exceljs` API and browser output behavior differ from SheetJS. It must not be adopted until the Factory Code import/export fixture checks pass.

## Approval Boundaries

- No production deployment or remote infrastructure changes in this stage.
- The selected spreadsheet replacement requires fixture evidence before its final adoption.
- Major package upgrades are reviewed as a unit with manifest and lockfile changes.

## Rollback

Each package stage is independently reversible by restoring the prior manifest and lockfile. No data migration is included in this plan.
