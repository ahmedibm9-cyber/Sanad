/**
 * Membership service for SANAD application.
 * 
 * Handles user-company membership operations.
 */

import { getSupabase, type Database } from '../supabase'
import { type RequestContext, requirePermission } from '../api'
import { NotFoundError, ConflictError, ForbiddenError, handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export interface Membership {
  id: string
  company_id: string
  user_id: string
  base_role: 'admin' | 'user' | 'viewer'
  active: boolean
  created_at: string
  updated_at: string
}

export interface MembershipWithUser extends Membership {
  users: {
    id: string
    display_name: string
    email: string
    active: boolean
  }
}

export interface MembershipWithCompany extends Membership {
  companies: {
    id: string
    name_en: string
    name_ar: string
    short_name: string
    company_code: string
  }
}

export interface CreateMembershipInput {
  company_id: string
  user_id: string
  base_role: 'admin' | 'user' | 'viewer'
}

export interface UpdateMembershipInput {
  base_role?: 'admin' | 'user' | 'viewer'
  active?: boolean
}

export interface PermissionRecord {
  id: string
  membership_id: string
  permission_key: string
  allowed: boolean
  created_at: string
}

// ===========================================
// Membership Service
// ===========================================

export class MembershipService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Get all memberships for a company.
   */
  async getCompanyMemberships(companyId: string, context: RequestContext): Promise<MembershipWithUser[]> {
    requirePermission(context, 'users.view')

    const { data, error } = await (this.supabase as any)
      .from('company_memberships')
      .select(`
        *,
        users:user_id (
          id,
          display_name,
          email,
          active
        )
      `)
      .eq('company_id', companyId)
      .eq('active', true)
      .order('created_at')

    if (error) {
      appLogger.error('Error fetching memberships', error)
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Get all memberships for a user.
   */
  async getUserMemberships(userId: string, context: RequestContext): Promise<MembershipWithCompany[]> {
    // Users can view their own memberships, admins can view any user's
    if (context.userId !== userId && !context.isSystemAdmin) {
      throw new ForbiddenError('Can only view own memberships')
    }

    const { data, error } = await (this.supabase as any)
      .from('company_memberships')
      .select(`
        *,
        companies:company_id (
          id,
          name_en,
          name_ar,
          short_name,
          company_code
        )
      `)
      .eq('user_id', userId)
      .eq('active', true)

    if (error) {
      appLogger.error('Error fetching user memberships', error)
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Get a specific membership by ID.
   */
  async getMembershipById(id: string, context: RequestContext): Promise<Membership> {
    const { data, error } = await (this.supabase as any)
      .from('company_memberships')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new NotFoundError('Membership', id)
    }

    return data
  }

  /**
   * Create a new membership.
   */
  async createMembership(input: CreateMembershipInput, context: RequestContext): Promise<Membership> {
    requirePermission(context, 'users.create')

    // Check if membership already exists
    const { data: existing } = await (this.supabase as any)
      .from('company_memberships')
      .select('id')
      .eq('company_id', input.company_id)
      .eq('user_id', input.user_id)
      .single()

    if (existing) {
      throw new ConflictError('User is already a member of this company')
    }

    // Check if user exists
    const { data: user } = await (this.supabase as any)
      .from('users')
      .select('id')
      .eq('id', input.user_id)
      .single()

    if (!user) {
      throw new NotFoundError('User', input.user_id)
    }

    // Check if company exists
    const { data: company } = await (this.supabase as any)
      .from('companies')
      .select('id')
      .eq('id', input.company_id)
      .single()

    if (!company) {
      throw new NotFoundError('Company', input.company_id)
    }

    const { data, error } = await (this.supabase as any)
      .from('company_memberships')
      .insert({
        company_id: input.company_id,
        user_id: input.user_id,
        base_role: input.base_role,
        active: true,
      })
      .select()
      .single()

    if (error) {
      appLogger.error('Error creating membership', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Membership created', {
      companyId: input.company_id,
      userId: input.user_id,
      role: input.base_role,
    })

    return data
  }

  /**
   * Update a membership.
   */
  async updateMembership(id: string, input: UpdateMembershipInput, context: RequestContext): Promise<Membership> {
    requirePermission(context, 'users.edit')

    const existing = await this.getMembershipById(id, context)

    const updateData: Record<string, unknown> = {}
    if (input.base_role !== undefined) updateData.base_role = input.base_role
    if (input.active !== undefined) updateData.active = input.active

    const { data, error } = await (this.supabase as any)
      .from('company_memberships')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      appLogger.error('Error updating membership', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Membership updated', { membershipId: id, changes: input })

    return data
  }

  /**
   * Remove a membership (deactivate).
   */
  async removeMembership(id: string, context: RequestContext): Promise<void> {
    requirePermission(context, 'users.edit')

    const existing = await this.getMembershipById(id, context)

    // Prevent removing yourself
    if (existing.user_id === context.userId) {
      throw new ForbiddenError('Cannot remove your own membership')
    }

    const { error } = await (this.supabase as any)
      .from('company_memberships')
      .update({ active: false })
      .eq('id', id)

    if (error) {
      appLogger.error('Error removing membership', error)
      throw handleSupabaseError(error)
    }

    appLogger.info('Membership removed', { membershipId: id })
  }

  /**
   * Get permissions for a membership.
   */
  async getMembershipPermissions(membershipId: string, context: RequestContext): Promise<PermissionRecord[]> {
    const { data, error } = await (this.supabase as any)
      .from('membership_permissions')
      .select('*')
      .eq('membership_id', membershipId)

    if (error) {
      appLogger.error('Error fetching permissions', error)
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Set permissions for a membership.
   * Replaces all existing permissions.
   */
  async setMembershipPermissions(
    membershipId: string,
    permissions: Array<{ permission_key: string; allowed: boolean }>,
    context: RequestContext
  ): Promise<void> {
    requirePermission(context, 'users.permissions.manage')

    // Get existing permissions for audit
    const existing = await this.getMembershipPermissions(membershipId, context)

    // Delete existing permissions
    const { error: deleteError } = await (this.supabase as any)
      .from('membership_permissions')
      .delete()
      .eq('membership_id', membershipId)

    if (deleteError) {
      appLogger.error('Error deleting existing permissions', deleteError)
      throw handleSupabaseError(deleteError)
    }

    // Insert new permissions
    if (permissions.length > 0) {
      const permissionRecords = permissions.map(p => ({
        membership_id: membershipId,
        permission_key: p.permission_key,
        allowed: p.allowed,
      }))

      const { error: insertError } = await (this.supabase as any)
        .from('membership_permissions')
        .insert(permissionRecords)

      if (insertError) {
        appLogger.error('Error inserting permissions', insertError)
        throw handleSupabaseError(insertError)
      }
    }

    appLogger.info('Permissions updated', {
      membershipId,
      previousCount: existing.length,
      newCount: permissions.length,
    })
  }

  /**
   * Get all available permissions from the catalog.
   */
  async getPermissionCatalog(): Promise<Array<{
    permission_key: string
    group_name: string
    description_en: string
    description_ar: string
    is_critical: boolean
    sort_order: number
  }>> {
    const { data, error } = await (this.supabase as any)
      .from('permission_catalog')
      .select('*')
      .order('sort_order')

    if (error) {
      appLogger.error('Error fetching permission catalog', error)
      throw handleSupabaseError(error)
    }

    return data || []
  }

  /**
   * Check if a user is a member of a company.
   */
  async isMember(userId: string, companyId: string): Promise<boolean> {
    const { data, error } = await (this.supabase as any)
      .from('company_memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('active', true)
      .single()

    return !error && !!data
  }
}

// Singleton instance
let membershipServiceInstance: MembershipService | null = null

export function getMembershipService(): MembershipService {
  if (!membershipServiceInstance) {
    membershipServiceInstance = new MembershipService()
  }
  return membershipServiceInstance
}
