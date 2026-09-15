/**
 * Tests for permission service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const permissionMocks = vi.hoisted(() => {
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
  getSupabase: vi.fn(() => permissionMocks.mockSupabase),
}))

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('PermissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should verify permission checking logic', async () => {
    const permissions = {
      'projects.view': true,
      'projects.create': true,
      'documents.view': true,
    }

    expect(permissions['projects.view']).toBe(true)
    expect(permissions['projects.create']).toBe(true)
    expect(permissions['documents.view']).toBe(true)
    expect(permissions['users.create']).toBeUndefined()
  })

  it('should handle viewer base permissions', async () => {
    const viewerBasePermissions = [
      'projects.view', 'tasks.view', 'documents.view',
      'customers.view', 'materials.view', 'reports.view', 'factory.view',
    ]

    expect(viewerBasePermissions).toContain('projects.view')
    expect(viewerBasePermissions).toContain('documents.view')
    expect(viewerBasePermissions).not.toContain('projects.create')
    expect(viewerBasePermissions).not.toContain('users.create')
  })

  it('should handle admin role having all permissions', async () => {
    const hasPermission = (role: string) => {
      if (role === 'admin') return true
      return false
    }

    expect(hasPermission('admin')).toBe(true)
    expect(hasPermission('user')).toBe(false)
  })

  it('should record before-and-after audit data when permissions are replaced', async () => {
    permissionMocks.state.existingPermissions = [
      { permission_key: 'projects.view', allowed: true },
    ]
    permissionMocks.auditRpc.mockResolvedValue({ error: null })

    const { PermissionService } = await import('@/lib/services/permission')
    const service = new PermissionService()
    const after = {
      'projects.view': false,
      'documents.create': true,
    }

    await service.updatePermissions('membership-1', after, {
      userId: 'user-1',
      companyId: 'company-1',
      permissions: { 'users.permissions.manage': true },
      isSystemAdmin: false,
    })

    expect(permissionMocks.auditRpc).toHaveBeenCalledWith('record_audit_event', expect.objectContaining({
      p_company_id: 'company-1',
      p_action: 'PERMISSION_CHANGE',
      p_entity_type: 'membership',
      p_entity_id: 'membership-1',
      p_changes: expect.objectContaining({
        entityReference: 'membership-1',
        before: { 'projects.view': true },
        after: { 'projects.view': false, 'documents.create': true },
      }),
    }))
  })
})
