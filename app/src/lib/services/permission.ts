/**
 * Permission service for SANAD application.
 * 
 * Handles permission checking and management.
 */

import { getSupabase, type Database } from '../supabase'
import { type RequestContext, requirePermission } from '../api'
import { handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export interface PermissionGroup {
  name: string
  permissions: PermissionItem[]
}

export interface PermissionItem {
  key: string
  description_en: string
  description_ar: string
  is_critical: boolean
}

export interface UserPermissions {
  userId: string
  companyId: string
  isSystemAdmin: boolean
  baseRole: 'admin' | 'user' | 'viewer' | null
  permissions: Record<string, boolean>
}

// ===========================================
// Permission Service
// ===========================================

export class PermissionService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Get all permissions for a user in a specific company.
   */
  async getUserPermissions(userId: string, companyId: string): Promise<UserPermissions> {
    // Check if user is system admin
    const { data: user } = await (this.supabase as any)
      .from('users')
      .select('is_system_admin')
      .eq('id', userId)
      .single()

    if (user?.is_system_admin) {
      // Admin has all permissions
      const allPerms = await this.getAllPermissions()
      const permissions: Record<string, boolean> = {}
      allPerms.forEach(p => { permissions[p] = true })

      return {
        userId,
        companyId,
        isSystemAdmin: true,
        baseRole: 'admin',
        permissions,
      }
    }

    // Get membership
    const { data: membership } = await (this.supabase as any)
      .from('company_memberships')
      .select('id, base_role')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('active', true)
      .single()

    if (!membership) {
      return {
        userId,
        companyId,
        isSystemAdmin: false,
        baseRole: null,
        permissions: {},
      }
    }

    // Admin role has all permissions
    if (membership.base_role === 'admin') {
      const allPerms = await this.getAllPermissions()
      const permissions: Record<string, boolean> = {}
      allPerms.forEach(p => { permissions[p] = true })

      return {
        userId,
        companyId,
        isSystemAdmin: false,
        baseRole: 'admin',
        permissions,
      }
    }

    // Get specific permissions
    const { data: permRecords } = await (this.supabase as any)
      .from('membership_permissions')
      .select('permission_key, allowed')
      .eq('membership_id', membership.id)

    const permissions: Record<string, boolean> = {}
    permRecords?.forEach((p: any) => { permissions[p.permission_key] = p.allowed })

    // Add base viewer permissions
    if (membership.base_role === 'viewer') {
      const viewerBase = [
        'projects.view', 'tasks.view', 'documents.view',
        'customers.view', 'materials.view', 'reports.view', 'factory.view',
      ]
      viewerBase.forEach(p => { if (!(p in permissions)) permissions[p] = true })
    }

    return {
      userId,
      companyId,
      isSystemAdmin: false,
      baseRole: membership.base_role,
      permissions,
    }
  }

  /**
   * Check if a user has a specific permission in a company.
   */
  async hasPermission(userId: string, companyId: string, permissionKey: string): Promise<boolean> {
    const userPerms = await this.getUserPermissions(userId, companyId)
    return userPerms.permissions[permissionKey] === true
  }

  /**
   * Require a permission or throw.
   */
  async requirePermission(userId: string, companyId: string, permissionKey: string): Promise<void> {
    const allowed = await this.hasPermission(userId, companyId, permissionKey)
    if (!allowed) {
      throw new Error(`Permission denied: ${permissionKey}`)
    }
  }

  /**
   * Get all available permissions grouped by module.
   */
  async getPermissionGroups(): Promise<PermissionGroup[]> {
    const { data, error } = await (this.supabase as any)
      .from('permission_catalog')
      .select('*')
      .order('sort_order')

    if (error) {
      appLogger.error('Error fetching permission catalog', error)
      throw error
    }

    // Group by group_name
    const groupMap = new Map<string, PermissionItem[]>()
    data?.forEach((item: any) => {
      if (!groupMap.has(item.group_name)) {
        groupMap.set(item.group_name, [])
      }
      groupMap.get(item.group_name)!.push({
        key: item.permission_key,
        description_en: item.description_en,
        description_ar: item.description_ar,
        is_critical: item.is_critical,
      })
    })

    return Array.from(groupMap.entries()).map(([name, permissions]) => ({
      name,
      permissions,
    }))
  }

  /**
   * Get all permission keys.
   */
  async getAllPermissions(): Promise<string[]> {
    const { data, error } = await (this.supabase as any)
      .from('permission_catalog')
      .select('permission_key')

    if (error) {
      appLogger.error('Error fetching permissions', error)
      return []
    }

    return data?.map((p: any) => p.permission_key) || []
  }

  /**
   * Get critical permissions.
   */
  async getCriticalPermissions(): Promise<string[]> {
    const { data, error } = await (this.supabase as any)
      .from('permission_catalog')
      .select('permission_key')
      .eq('is_critical', true)

    if (error) {
      appLogger.error('Error fetching critical permissions', error)
      return []
    }

    return data?.map((p: any) => p.permission_key) || []
  }

  /**
   * Bulk update permissions for a membership.
   */
  async updatePermissions(
    membershipId: string,
    permissions: Record<string, boolean>,
    context: RequestContext
  ): Promise<void> {
    requirePermission(context, 'users.permissions.manage')

    // Get existing permissions for audit
    const { data: existing } = await (this.supabase as any)
      .from('membership_permissions')
      .select('permission_key, allowed')
      .eq('membership_id', membershipId)

    const before = existing?.reduce((acc: Record<string, boolean>, p: any) => {
      acc[p.permission_key] = p.allowed
      return acc
    }, {}) || {}

    // Delete existing
    const { error: deleteError } = await (this.supabase as any)
      .from('membership_permissions')
      .delete()
      .eq('membership_id', membershipId)

    if (deleteError) {
      throw handleSupabaseError(deleteError)
    }

    // Insert new permissions
    const permissionRecords = Object.entries(permissions).map(([key, allowed]) => ({
      membership_id: membershipId,
      permission_key: key,
      allowed,
    }))

    if (permissionRecords.length > 0) {
      const { error: insertError } = await (this.supabase as any)
        .from('membership_permissions')
        .insert(permissionRecords)

      if (insertError) {
        throw handleSupabaseError(insertError)
      }
    }

    appLogger.info('Permissions updated', {
      membershipId,
      before,
      after: permissions,
    })
  }
}

// Singleton instance
let permissionServiceInstance: PermissionService | null = null

export function getPermissionService(): PermissionService {
  if (!permissionServiceInstance) {
    permissionServiceInstance = new PermissionService()
  }
  return permissionServiceInstance
}
