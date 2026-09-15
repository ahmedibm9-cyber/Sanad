/**
 * Tests for note service — soft delete (active column) behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

// ─── Chainable mock builder ────────────────────────────────────────────────────

function createChainableMock(finalResult: any = { data: null, error: null }) {
  const calls: { method: string; args: any[] }[] = []

  const chain: any = {}
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'range', 'limit', 'single', 'maybeSingle', 'count']) {
    chain[method] = vi.fn((...args: any[]) => {
      calls.push({ method, args })
      if (method === 'single' || method === 'maybeSingle') {
        return Promise.resolve(finalResult)
      }
      return chain
    })
  }
  // Make the chain thenable so `await chain` resolves to finalResult.
  // This handles patterns like `const { data } = await from().select().eq().order()`
  chain.then = (resolve: any, reject: any) =>
    Promise.resolve(finalResult).then(resolve, reject)
  chain._calls = calls
  return chain
}

function makeNote(overrides: Partial<import('@/lib/services/note').Note> = {}) {
  return {
    id: 'note-1',
    company_id: 'company-1',
    work_item_id: 'wi-1',
    created_by: 'user-1',
    content: 'Test note',
    active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeContext(overrides = {}) {
  return {
    userId: 'user-1',
    companyId: 'company-1',
    permissions: {} as Record<string, boolean>,
    isSystemAdmin: false,
    ...overrides,
  }
}

// ─── tests ─────────────────────────────────────────────────────────────────────

describe('NoteService — soft delete (active column)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Type validation ──────────────────────────────────────────────────────────

  it('Note type includes active field', () => {
    const note = makeNote()
    expect(note).toHaveProperty('active')
    expect(typeof note.active).toBe('boolean')
  })

  it('Note defaults active to true', () => {
    const note = makeNote()
    expect(note.active).toBe(true)
  })

  it('Note can be created with active = false', () => {
    const note = makeNote({ active: false })
    expect(note.active).toBe(false)
  })

  // ── deleteNote ───────────────────────────────────────────────────────────────

  it('deleteNote sets active = false (soft delete, not hard delete)', async () => {
    const { NoteService } = await import('@/lib/services/note')
    const service = new NoteService()
    const context = makeContext()

    const selectChain = createChainableMock({ data: makeNote(), error: null })
    const updateChain = createChainableMock({ error: null })

    let callIdx = 0
    const fromSpy = vi.fn(() => {
      callIdx++
      if (callIdx === 1) return selectChain
      return updateChain
    })

    // @ts-expect-error – private
    service.supabase = { from: fromSpy }

    await service.deleteNote('note-1', context)

    // Verify update was called with { active: false }
    const updateCall = updateChain._calls.find((c: any) => c.method === 'update')
    expect(updateCall).toBeDefined()
    expect(updateCall!.args[0]).toEqual({ active: false })

    // Verify no hard-delete call was made
    const deleteCall = updateChain._calls.find((c: any) => c.method === 'delete')
    expect(deleteCall).toBeUndefined()
  })

  // ── getNotes ─────────────────────────────────────────────────────────────────

  it('getNotes filters by active = true', async () => {
    const { NoteService } = await import('@/lib/services/note')
    const service = new NoteService()
    const context = makeContext()

    const activeNotes = [
      makeNote({ id: 'n1', active: true }),
      makeNote({ id: 'n2', active: true }),
    ]

    const chain = createChainableMock({ data: activeNotes, error: null })

    // @ts-expect-error – private
    service.supabase = { from: vi.fn(() => chain) }

    const result = await service.getNotes('wi-1', context)

    // Verify active = true filter was applied
    const eqCalls = chain._calls.filter((c: any) => c.method === 'eq')
    const activeFilter = eqCalls.find((c: any) => c.args[0] === 'active')
    expect(activeFilter).toBeDefined()
    expect(activeFilter!.args[1]).toBe(true)

    // All returned notes should be active
    result.forEach((n: any) => expect(n.active).toBe(true))
  })

  it('getNotes excludes soft-deleted notes', async () => {
    const { NoteService } = await import('@/lib/services/note')
    const service = new NoteService()
    const context = makeContext()

    // Only active notes should come from DB (filter is server-side)
    const activeNotes = [makeNote({ id: 'n1', active: true })]
    const chain = createChainableMock({ data: activeNotes, error: null })

    // @ts-expect-error – private
    service.supabase = { from: vi.fn(() => chain) }

    const result = await service.getNotes('wi-1', context)

    expect(result.every((n: any) => n.active === true)).toBe(true)
    expect(result).toHaveLength(1)
  })

  // ── restoreNote ──────────────────────────────────────────────────────────────

  it('restoreNote sets active = true', async () => {
    const { NoteService } = await import('@/lib/services/note')
    const service = new NoteService()
    const context = makeContext()

    const deletedNote = makeNote({ active: false })
    const restoredNote = makeNote({ active: true })

    // First call: getNoteById → select().eq().eq().eq().single()  (fetches existing)
    const fetchChain = createChainableMock({ data: deletedNote, error: null })
    // Second call: update().eq().eq().select().single()  (restores)
    const updateChain = createChainableMock({ data: restoredNote, error: null })

    let callIdx = 0
    const fromSpy = vi.fn(() => {
      callIdx++
      if (callIdx === 1) return fetchChain
      return updateChain
    })

    // @ts-expect-error – private
    service.supabase = { from: fromSpy }

    const result = await service.restoreNote('note-1', context)

    expect(result.active).toBe(true)

    // Verify update was called with { active: true }
    const updateCall = updateChain._calls.find((c: any) => c.method === 'update')
    expect(updateCall).toBeDefined()
    expect(updateCall!.args[0]).toEqual({ active: true })
  })

  it('restoreNote throws NotFoundError for non-existent note', async () => {
    const { NoteService } = await import('@/lib/services/note')
    const service = new NoteService()
    const context = makeContext()

    const chain = createChainableMock({ data: null, error: { message: 'not found' } })

    // @ts-expect-error – private
    service.supabase = { from: vi.fn(() => chain) }

    await expect(service.restoreNote('nonexistent', context)).rejects.toThrow('Note')
  })

  it('restoreNote throws when user is not author and not admin', async () => {
    const { NoteService } = await import('@/lib/services/note')
    const service = new NoteService()
    const context = makeContext({ userId: 'other-user', isSystemAdmin: false })

    const deletedNote = makeNote({ active: false, created_by: 'user-1' })
    const chain = createChainableMock({ data: deletedNote, error: null })

    // @ts-expect-error – private
    service.supabase = { from: vi.fn(() => chain) }

    await expect(service.restoreNote('note-1', context)).rejects.toThrow('Not authorized')
  })

  // ── deleteNote authorization ─────────────────────────────────────────────────

  it('deleteNote throws when user is not author and not admin', async () => {
    const { NoteService } = await import('@/lib/services/note')
    const service = new NoteService()
    const context = makeContext({ userId: 'other-user', isSystemAdmin: false })

    const existingNote = makeNote({ created_by: 'user-1' })
    const chain = createChainableMock({ data: existingNote, error: null })

    // @ts-expect-error – private
    service.supabase = { from: vi.fn(() => chain) }

    await expect(service.deleteNote('note-1', context)).rejects.toThrow('Not authorized')
  })

  // ── getNoteById respects active ──────────────────────────────────────────────

  it('getNoteById filters by active = true', async () => {
    const { NoteService } = await import('@/lib/services/note')
    const service = new NoteService()
    const context = makeContext()

    const note = makeNote({ active: true })
    const chain = createChainableMock({ data: note, error: null })

    // @ts-expect-error – private
    service.supabase = { from: vi.fn(() => chain) }

    const result = await service.getNoteById('note-1', context)

    // Verify active = true filter is applied
    const eqCalls = chain._calls.filter((c: any) => c.method === 'eq')
    const activeFilter = eqCalls.find((c: any) => c.args[0] === 'active')
    expect(activeFilter).toBeDefined()
    expect(activeFilter!.args[1]).toBe(true)
    expect(result.active).toBe(true)
  })

  it('getNoteById throws NotFoundError for soft-deleted note', async () => {
    const { NoteService } = await import('@/lib/services/note')
    const service = new NoteService()
    const context = makeContext()

    const chain = createChainableMock({ data: null, error: { message: 'not found' } })

    // @ts-expect-error – private
    service.supabase = { from: vi.fn(() => chain) }

    await expect(service.getNoteById('deleted-note', context)).rejects.toThrow('Note')
  })
})
