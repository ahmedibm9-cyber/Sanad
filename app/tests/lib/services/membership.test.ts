/**
 * Tests for membership service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const state = {
    existingPermissions: [] as Array<{ permission_key: string; allowed: boolean }>,
  }
  const auditRpc = vi.fn().mockResolvedValue({ error: null })
  const membershipChain = {
    select: vi.fn(() => membershipChain),
    delete: vi.fn(() => membershipChain),
    eq: vi.fn(() => ({ data: state.existingPermissions, error: null })),
    insert: vi.fn().mockResolvedValue({ error: null }),
  }
  const mockSupabase = {
    from: vi.fn((table: string) => {
      if (table === 'membership_permissions') return membershipChain
      return {}
    }),
    rpc: auditRpc,
  }

  return { state, auditRpc, mockSupabase }
})

vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(() => mocks.mockSupabase),
}))

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('MembershipService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should record before-and-after audit data when permissions are replaced', async () => {
    mocks.state.existingPermissions = [
      { permission_key: 'projects.view', allowed: true },
    ]
    mocks.auditRpc.mockResolvedValue({ error: null })

    const { MembershipService } = await import('@/lib/services/membership')
    const service = new MembershipService()

    await service.setMembershipPermissions(
      'membership-1',
      [{ permission_key: 'projects.view', allowed: false }],
      {
        userId: 'user-1',
        companyId: 'company-1',
        permissions: { 'users.permissions.manage': true },
        isSystemAdmin: false,
      },
    )

    expect(mocks.auditRpc).toHaveBeenCalledWith('record_audit_event', expect.objectContaining({
      p_company_id: 'company-1',
      p_action: 'PERMISSION_CHANGE',
      p_entity_type: 'membership',
      p_entity_id: 'membership-1',
      p_changes: expect.objectContaining({
        entityReference: 'membership-1',
        before: { 'projects.view': true },
        after: { 'projects.view': false },
      }),
    }))
  })
})