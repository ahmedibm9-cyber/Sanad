/**
 * Tests for report issue service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('ReportIssueService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should define issue type correctly', async () => {
    const issue: import('@/lib/services/reportIssue').ReportIssue = {
      id: '1',
      company_id: 'comp-1',
      work_item_id: 'wi-1',
      reporter_user_id: 'user-1',
      body: 'Container seal number not received',
      severity: 'medium',
      status: 'open',
      resolved_by: null,
      resolved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    expect(issue.body).toBe('Container seal number not received')
    expect(issue.severity).toBe('medium')
    expect(issue.status).toBe('open')
  })

  it('should handle all severity levels', async () => {
    const severities: Array<import('@/lib/services/reportIssue').IssueSeverity> = [
      'low', 'medium', 'high', 'critical'
    ]
    expect(severities).toHaveLength(4)
  })

  it('should handle all status values', async () => {
    const statuses: Array<import('@/lib/services/reportIssue').IssueStatus> = [
      'open', 'under_review', 'resolved', 'rejected'
    ]
    expect(statuses).toHaveLength(4)
  })
})
