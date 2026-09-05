/**
 * Tests for note service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('NoteService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should define note type correctly', async () => {
    const note: import('@/lib/services/note').Note = {
      id: '1',
      company_id: 'comp-1',
      work_item_id: 'wi-1',
      author_user_id: 'user-1',
      body: 'This is a test note',
      created_at: new Date().toISOString(),
    }

    expect(note.body).toBe('This is a test note')
    expect(note.author_user_id).toBe('user-1')
  })
})
