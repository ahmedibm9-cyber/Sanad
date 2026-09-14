/**
 * Migration Idempotency Validation Tests
 *
 * Meta-tests that read SQL migration files and validate idempotency patterns:
 * - CREATE TABLE must use IF NOT EXISTS
 * - CREATE INDEX must use IF NOT EXISTS
 * - Foreign keys must have ON DELETE clauses
 * - Seed INSERT must use ON CONFLICT
 * - DROP TABLE must use IF EXISTS
 */

import { readFileSync, readdirSync } from 'fs'
import { join, resolve } from 'path'

const MIGRATIONS_DIR = resolve(__dirname, '../../../supabase/migrations')

function getMigrationFiles(): string[] {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()
  return files.map(f => join(MIGRATIONS_DIR, f))
}

function readFile(path: string): string {
  return readFileSync(path, 'utf-8')
}

/**
 * Strip SQL single-line and block comments so regex checks
 * don't match commented-out statements.
 */
function stripComments(sql: string): string {
  // Remove block comments /* ... */
  let result = sql.replace(/\/\*[\s\S]*?\*\//g, '')
  // Remove single-line comments -- ...
  result = result.replace(/--.*$/gm, '')
  return result
}

/**
 * Strip string literals so regex checks don't match
 * patterns inside quoted text.
 */
function stripStrings(sql: string): string {
  // Remove single-quoted strings (escape '' inside)
  return sql.replace(/'[^']*'/g, "''")
}

function clean(sql: string): string {
  return stripStrings(stripComments(sql))
}

// ─── Rule 1: CREATE TABLE must use IF NOT EXISTS ───────────────────────

describe('Migration idempotency: CREATE TABLE', () => {
  const files = getMigrationFiles()

  it.each(files)('%s — every CREATE TABLE uses IF NOT EXISTS', (filePath) => {
    const raw = readFile(filePath)
    const sql = clean(raw)

    // Match CREATE TABLE [IF NOT EXISTS] <name> but exclude CREATE TABLE IF NOT EXISTS (which is fine)
    const createTablePattern = /CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS\s)(\w+)/gi
    const violations: string[] = []

    let match: RegExpExecArray | null
    while ((match = createTablePattern.exec(sql)) !== null) {
      violations.push(match[1])
    }

    expect(
      violations,
      `CREATE TABLE without IF NOT EXISTS: ${violations.join(', ')}`
    ).toHaveLength(0)
  })
})

// ─── Rule 2: CREATE INDEX must use IF NOT EXISTS ───────────────────────

describe('Migration idempotency: CREATE INDEX', () => {
  const files = getMigrationFiles()

  it.each(files)('%s — every CREATE INDEX uses IF NOT EXISTS', (filePath) => {
    const raw = readFile(filePath)
    const sql = clean(raw)

    // Match CREATE [UNIQUE] INDEX but exclude those with IF NOT EXISTS
    const createIndexPattern = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?!IF\s+NOT\s+EXISTS\s)(\w+)/gi
    const violations: string[] = []

    let match: RegExpExecArray | null
    while ((match = createIndexPattern.exec(sql)) !== null) {
      violations.push(match[1])
    }

    expect(
      violations,
      `CREATE INDEX without IF NOT EXISTS: ${violations.join(', ')}`
    ).toHaveLength(0)
  })
})

// ─── Rule 3: Foreign keys must have ON DELETE clauses ──────────────────

describe('Migration idempotency: Foreign key ON DELETE', () => {
  const files = getMigrationFiles()

  it.each(files)('%s — every FK reference has an ON DELETE clause', (filePath) => {
    const raw = readFile(filePath)
    const sql = clean(raw)

    // Find all REFERENCES <table>(<col>) patterns
    const refPattern = /REFERENCES\s+(\w+)\s*\([^)]+\)/gi
    const violations: string[] = []

    let match: RegExpExecArray | null
    while ((match = refPattern.exec(sql)) !== null) {
      const refStart = match.index
      const refEnd = refStart + match[0].length
      // Look ahead for ON DELETE / ON UPDATE in the same statement (up to next semicolon)
      const stmtEnd = sql.indexOf(';', refEnd)
      const afterRef = sql.substring(refEnd, stmtEnd === -1 ? sql.length : stmtEnd)

      if (!/ON\s+DELETE/i.test(afterRef)) {
        violations.push(`REFERENCES ${match[1]}(...) without ON DELETE`)
      }
    }

    expect(
      violations,
      `FK without ON DELETE: ${violations.join('; ')}`
    ).toHaveLength(0)
  })
})

// ─── Rule 4: Seed INSERT must use ON CONFLICT ──────────────────────────

describe('Migration idempotency: INSERT ON CONFLICT', () => {
  const files = getMigrationFiles()

  it.each(files)('%s — every INSERT uses ON CONFLICT', (filePath) => {
    const raw = readFile(filePath)
    const sql = clean(raw)

    // Only check INSERT statements that appear inside DO $$ blocks or direct seed statements.
    // We skip INSERTs inside function bodies (CREATE OR REPLACE FUNCTION ... $$ ... $$)
    // because those are template strings executed later, not direct inserts.

    // Remove function bodies first
    const withoutFunctions = sql.replace(
      /\$\$[\s\S]*?\$\$/g,
      ''
    )

    // Match INSERT INTO <table> statements
    const insertPattern = /INSERT\s+INTO\s+(\w+)/gi
    const violations: string[] = []

    let match: RegExpExecArray | null
    while ((match = insertPattern.exec(withoutFunctions)) !== null) {
      const insertStart = match.index
      const insertEnd = insertStart + match[0].length
      // Check if ON CONFLICT appears before the next semicolon
      const stmtEnd = withoutFunctions.indexOf(';', insertEnd)
      const afterInsert = withoutFunctions.substring(
        insertEnd,
        stmtEnd === -1 ? withoutFunctions.length : stmtEnd
      )

      if (!/ON\s+CONFLICT/i.test(afterInsert)) {
        violations.push(`INSERT INTO ${match[1]}`)
      }
    }

    expect(
      violations,
      `INSERT without ON CONFLICT: ${violations.join('; ')}`
    ).toHaveLength(0)
  })
})

// ─── Rule 5: DROP TABLE must use IF EXISTS ─────────────────────────────

describe('Migration idempotency: DROP TABLE', () => {
  const files = getMigrationFiles()

  it.each(files)('%s — every DROP TABLE uses IF EXISTS', (filePath) => {
    const raw = readFile(filePath)
    const sql = clean(raw)

    const dropTablePattern = /DROP\s+TABLE\s+(?!IF\s+EXISTS\s)(\w+)/gi
    const violations: string[] = []

    let match: RegExpExecArray | null
    while ((match = dropTablePattern.exec(sql)) !== null) {
      violations.push(match[1])
    }

    expect(
      violations,
      `DROP TABLE without IF EXISTS: ${violations.join(', ')}`
    ).toHaveLength(0)
  })
})

// ─── Summary: list all migrations scanned ──────────────────────────────

describe('Migration coverage', () => {
  it('scans all expected migration files', () => {
    const files = getMigrationFiles()
    expect(files.length).toBeGreaterThanOrEqual(15)
  })
})
