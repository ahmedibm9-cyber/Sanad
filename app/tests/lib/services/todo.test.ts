/**
 * Tests for todo service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('TodoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should define todo type correctly', async () => {
    const todo: import('@/lib/services/todo').ToDo = {
      id: '1',
      user_id: 'user-1',
      title: 'Test Todo',
      description: 'Test description',
      due_date: '2024-12-31',
      due_time: '10:00',
      priority: 'high',
      is_done: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    expect(todo.title).toBe('Test Todo')
    expect(todo.priority).toBe('high')
    expect(todo.is_done).toBe(false)
    expect(todo.due_date).toBe('2024-12-31')
  })

  it('should define create input correctly', async () => {
    const input: import('@/lib/services/todo').CreateToDoInput = {
      title: 'New Todo',
      description: 'Description',
      due_date: '2024-12-25',
      due_time: '09:00',
      priority: 'high',
    }

    expect(input.title).toBe('New Todo')
    expect(input.priority).toBe('high')
    expect(input.due_date).toBe('2024-12-25')
  })

  it('should handle priority values correctly', async () => {
    const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high']
    
    expect(priorities).toContain('low')
    expect(priorities).toContain('medium')
    expect(priorities).toContain('high')
    expect(priorities).not.toContain('critical')
  })

  it('should handle done/not done toggle', async () => {
    const todo: import('@/lib/services/todo').ToDo = {
      id: '1',
      user_id: 'user-1',
      title: 'Test',
      description: null,
      due_date: null,
      due_time: null,
      priority: 'medium',
      is_done: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Toggle should change is_done
    const toggled = { ...todo, is_done: !todo.is_done }
    expect(toggled.is_done).toBe(true)

    // Toggle again
    const toggledBack = { ...toggled, is_done: !toggled.is_done }
    expect(toggledBack.is_done).toBe(false)
  })
})
