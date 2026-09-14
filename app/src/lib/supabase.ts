/**
 * Supabase client configuration and utilities.
 * 
 * This module provides a typed Supabase client for the SANAD application.
 * The client is configured for browser-side use with the anon key.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from './env'
import { appLogger } from './logger'

// Database schema type definitions
export interface Database {
  public: {
    Tables: {
      deployments: {
        Row: {
          id: string
          name: string
          installation_id: string
          license_status: string
          license_last_verified_at: string | null
          settings_json: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          installation_id: string
          license_status?: string
          license_last_verified_at?: string | null
          settings_json?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          installation_id?: string
          license_status?: string
          license_last_verified_at?: string | null
          settings_json?: Record<string, unknown> | null
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          display_name: string
          email: string
          preferred_language: 'en' | 'ar'
          is_system_admin: boolean
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          display_name: string
          email: string
          preferred_language?: 'en' | 'ar'
          is_system_admin?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          email?: string
          preferred_language?: 'en' | 'ar'
          is_system_admin?: boolean
          active?: boolean
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name_en: string
          name_ar: string
          legal_name_en: string | null
          legal_name_ar: string | null
          short_name: string
          company_code: string
          active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          name_en: string
          name_ar: string
          legal_name_en?: string | null
          legal_name_ar?: string | null
          short_name: string
          company_code: string
          active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          name_en?: string
          name_ar?: string
          legal_name_en?: string | null
          legal_name_ar?: string | null
          short_name?: string
          company_code?: string
          active?: boolean
          updated_at?: string
          updated_by?: string | null
        }
      }
      company_memberships: {
        Row: {
          id: string
          company_id: string
          user_id: string
          base_role: 'admin' | 'user' | 'viewer'
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          base_role: 'admin' | 'user' | 'viewer'
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          base_role?: 'admin' | 'user' | 'viewer'
          active?: boolean
          updated_at?: string
        }
      }
      membership_permissions: {
        Row: {
          id: string
          membership_id: string
          permission_key: string
          allowed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          membership_id: string
          permission_key: string
          allowed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          membership_id?: string
          permission_key?: string
          allowed?: boolean
        }
      }
      permission_catalog: {
        Row: {
          id: string
          permission_key: string
          group_name: string
          description_en: string
          description_ar: string
          is_critical: boolean
          sort_order: number
        }
        Insert: {
          id?: string
          permission_key: string
          group_name: string
          description_en: string
          description_ar: string
          is_critical?: boolean
          sort_order?: number
        }
        Update: {
          id?: string
          permission_key?: string
          group_name?: string
          description_en?: string
          description_ar?: string
          is_critical?: boolean
          sort_order?: number
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Singleton Supabase client
let supabaseInstance: SupabaseClient<Database> | null = null

/**
 * Get or create the Supabase client instance.
 * Uses singleton pattern to avoid creating multiple clients.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (supabaseInstance) return supabaseInstance

  const url = env.supabaseUrl
  const key = env.supabaseAnonKey

  supabaseInstance = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseInstance
}

/**
 * Get the current Supabase session.
 * Returns null if not authenticated.
 */
export async function getCurrentSession() {
  const supabase = getSupabase()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    appLogger.error('Error getting session', error.message)
    return null
  }
  return session
}

/**
 * Get the current user profile from the users table.
 */
export async function getCurrentUserProfile() {
  const supabase = getSupabase()
  const session = await getCurrentSession()
  if (!session) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (error) {
    appLogger.error('Error fetching user profile', error.message)
    return null
  }

  return data
}

/**
 * Get the current user's memberships with permissions.
 */
export async function getUserMemberships(userId: string) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('company_memberships')
    .select(`
      *,
      companies (*)
    `)
    .eq('user_id', userId)
    .eq('active', true)

  if (error) {
    appLogger.error('Error fetching memberships', error.message)
    return []
  }

  return data || []
}

/**
 * Get permissions for a specific membership.
 */
export async function getMembershipPermissions(membershipId: string) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('membership_permissions')
    .select('permission_key, allowed')
    .eq('membership_id', membershipId)

  if (error) {
    appLogger.error('Error fetching permissions', error.message)
    return []
  }

  return data || []
}

/**
 * Check if a user has a specific permission for a company.
 */
export async function hasPermission(
  userId: string,
  companyId: string,
  permissionKey: string
): Promise<boolean> {
  const supabase = getSupabase()

  // Check if user is system admin
  const { data: user } = await (supabase as any)
    .from('users')
    .select('is_system_admin')
    .eq('id', userId)
    .single()

  if (user?.is_system_admin) return true

  // Get membership
  const { data: membership } = await (supabase as any)
    .from('company_memberships')
    .select('id, base_role')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .eq('active', true)
    .single()

  if (!membership) return false

  // Admin role has all permissions
  if (membership.base_role === 'admin') return true

  // Check specific permission
  const { data: perm } = await (supabase as any)
    .from('membership_permissions')
    .select('allowed')
    .eq('membership_id', membership.id)
    .eq('permission_key', permissionKey)
    .single()

  // Viewer has base permissions
  if (membership.base_role === 'viewer') {
    const viewerBasePermissions = [
      'projects.view',
      'tasks.view',
      'documents.view',
      'customers.view',
      'materials.view',
      'reports.view',
      'factory.view',
    ]
    if (viewerBasePermissions.includes(permissionKey)) return true
    if (permissionKey === 'files.download') return perm?.allowed === true
    return false
  }

  return perm?.allowed === true
}

/**
 * Get all permissions for a user in a company.
 */
export async function getUserPermissions(
  userId: string,
  companyId: string
): Promise<Record<string, boolean>> {
  const supabase = getSupabase()

  const { data: user } = await (supabase as any)
    .from('users')
    .select('is_system_admin')
    .eq('id', userId)
    .single()

  if (user?.is_system_admin) {
    // Admin has all permissions
    const { data: allPerms } = await (supabase as any)
      .from('permission_catalog')
      .select('permission_key')
    
    const perms: Record<string, boolean> = {}
    allPerms?.forEach((p: any) => { perms[p.permission_key] = true })
    return perms
  }

  const { data: membership } = await (supabase as any)
    .from('company_memberships')
    .select('id, base_role')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .eq('active', true)
    .single()

  if (!membership) return {}

  if (membership.base_role === 'admin') {
    const { data: allPerms } = await (supabase as any)
      .from('permission_catalog')
      .select('permission_key')
    
    const perms: Record<string, boolean> = {}
    allPerms?.forEach((p: any) => { perms[p.permission_key] = true })
    return perms
  }

  const { data: perms } = await (supabase as any)
    .from('membership_permissions')
    .select('permission_key, allowed')
    .eq('membership_id', membership.id)

  const permMap: Record<string, boolean> = {}
  perms?.forEach((p: any) => { permMap[p.permission_key] = p.allowed })
  return permMap
}

export type { SupabaseClient }
