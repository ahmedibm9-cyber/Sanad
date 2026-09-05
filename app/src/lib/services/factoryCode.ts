/**
 * Factory Code service for SANAD application.
 * 
 * Handles the shared Saudi Factory Code master database.
 * Shared across all companies, never deleted from source.
 */

import { getSupabase, type Database } from '../supabase'
import { type RequestContext, requirePermission } from '../api'
import { handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export interface FactoryCodeRecord {
  id: string
  stable_source_key: string
  factory_code: string | null
  factory_name: string | null
  factory_name_ar: string | null
  city: string | null
  region: string | null
  activity: string | null
  product: string | null
  hs_code: string | null
  registration_number: string | null
  first_seen_import_id: string | null
  last_seen_import_id: string | null
  created_at: string
  updated_at: string
}

export interface FactoryCodeImport {
  id: string
  uploaded_by: string | null
  source_filename: string
  r2_object_key: string | null
  checksum: string | null
  row_count: number
  inserted_count: number
  updated_count: number
  unchanged_count: number
  started_at: string
  completed_at: string | null
  status: string
  error_message: string | null
}

export interface ImportPreviewRow {
  factory_code: string
  factory_name: string
  city: string
  product: string
  action: 'add' | 'update' | 'unchanged'
}

export interface ImportSummary {
  inserted: number
  updated: number
  unchanged: number
  retained: number // old records not in new source
  errors: number
  preview: ImportPreviewRow[]
}

// ===========================================
// Factory Code Service
// ===========================================

export class FactoryCodeService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Search factory code records.
   */
  async search(
    query: string,
    context: RequestContext,
    options: {
      page?: number
      pageSize?: number
      city?: string
      region?: string
      activity?: string
    } = {}
  ): Promise<{ data: FactoryCodeRecord[]; total: number }> {
    const { page = 1, pageSize = 50, city, region, activity } = options
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let q = (this.supabase as any)
      .from('factory_code_records')
      .select('*', { count: 'exact' })

    // Text search
    if (query && query.trim()) {
      q = q.or(`factory_code.ilike.%${query}%,factory_name.ilike.%${query}%,factory_name_ar.ilike.%${query}%,city.ilike.%${query}%,product.ilike.%${query}%,hs_code.ilike.%${query}%,activity.ilike.%${query}%,registration_number.ilike.%${query}%`)
    }

    // Filters
    if (city) q = q.eq('city', city)
    if (region) q = q.eq('region', region)
    if (activity) q = q.eq('activity', activity)

    q = q.range(from, to).order('factory_code')

    const { data, error, count } = await q

    if (error) {
      appLogger.error('Error searching factory codes', error)
      throw handleSupabaseError(error)
    }

    return {
      data: data || [],
      total: count || 0,
    }
  }

  /**
   * Get a factory code record by ID.
   */
  async getRecordById(id: string): Promise<FactoryCodeRecord | null> {
    const { data, error } = await (this.supabase as any)
      .from('factory_code_records')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  /**
   * Get total record count.
   */
  async getRecordCount(): Promise<number> {
    const { count, error } = await (this.supabase as any)
      .from('factory_code_records')
      .select('*', { count: 'exact', head: true })

    if (error) return 0
    return count || 0
  }

  /**
   * Get distinct values for a column (for filter options).
   */
  async getFilterOptions(column: string): Promise<string[]> {
    const { data, error } = await (this.supabase as any)
      .from('factory_code_records')
      .select(column)
      .not(column, 'is', null)
      .order(column)

    if (error || !data) return []

    const unique = [...new Set(data.map((r: any) => r[column]).filter(Boolean))]
    return unique as string[]
  }

  /**
   * Smart merge: add new, update changed, retain unchanged.
   * Never deletes old records missing from source.
   */
  async smartMerge(
    records: Array<Record<string, unknown>>,
    context: RequestContext
  ): Promise<ImportSummary> {
    requirePermission(context, 'factory.import_update')

    let inserted = 0
    let updated = 0
    let unchanged = 0
    let errors = 0
    const preview: ImportPreviewRow[] = []

    // Create import record
    const { data: importRecord } = await (this.supabase as any)
      .from('factory_code_imports')
      .insert({
        uploaded_by: context.userId,
        source_filename: 'uploaded-file.xlsx',
        row_count: records.length,
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    const importId = importRecord?.id

    for (const record of records) {
      try {
        const sourceKey = this.generateSourceKey(record)
        if (!sourceKey) {
          errors++
          continue
        }

        // Check if record exists
        const { data: existing } = await (this.supabase as any)
          .from('factory_code_records')
          .select('id, factory_code, factory_name, city, product')
          .eq('stable_source_key', sourceKey)
          .single()

        if (existing) {
          // Check if changed
          const isChanged = this.hasChanged(existing, record)
          
          if (isChanged) {
            // Update
            await (this.supabase as any)
              .from('factory_code_records')
              .update({
                factory_code: record.factory_code || null,
                factory_name: record.factory_name || null,
                factory_name_ar: record.factory_name_ar || null,
                city: record.city || null,
                region: record.region || null,
                activity: record.activity || null,
                product: record.product || null,
                hs_code: record.hs_code || null,
                registration_number: record.registration_number || null,
                last_seen_import_id: importId,
              })
              .eq('id', existing.id)
            
            updated++
            preview.push({
              factory_code: record.factory_code as string || '',
              factory_name: record.factory_name as string || '',
              city: record.city as string || '',
              product: record.product as string || '',
              action: 'update',
            })
          } else {
            unchanged++
            preview.push({
              factory_code: record.factory_code as string || '',
              factory_name: record.factory_name as string || '',
              city: record.city as string || '',
              product: record.product as string || '',
              action: 'unchanged',
            })
          }
        } else {
          // Insert new
          await (this.supabase as any)
            .from('factory_code_records')
            .insert({
              stable_source_key: sourceKey,
              factory_code: record.factory_code || null,
              factory_name: record.factory_name || null,
              factory_name_ar: record.factory_name_ar || null,
              city: record.city || null,
              region: record.region || null,
              activity: record.activity || null,
              product: record.product || null,
              hs_code: record.hs_code || null,
              registration_number: record.registration_number || null,
              first_seen_import_id: importId,
              last_seen_import_id: importId,
            })
          
          inserted++
          preview.push({
            factory_code: record.factory_code as string || '',
            factory_name: record.factory_name as string || '',
            city: record.city as string || '',
            product: record.product as string || '',
            action: 'add',
          })
        }
      } catch (e) {
        errors++
      }
    }

    // Update import record
    if (importId) {
      await (this.supabase as any)
        .from('factory_code_imports')
        .update({
          inserted_count: inserted,
          updated_count: updated,
          unchanged_count: unchanged,
          completed_at: new Date().toISOString(),
          status: errors > 0 && inserted + updated === 0 ? 'failed' : 'completed',
        })
        .eq('id', importId)
    }

    appLogger.info('Factory code import completed', {
      inserted,
      updated,
      unchanged,
      errors,
      retained: await this.getRecordCount() - inserted - updated,
    })

    return {
      inserted,
      updated,
      unchanged,
      retained: await this.getRecordCount() - inserted - updated,
      errors,
      preview: preview.slice(0, 100), // Limit preview to 100 rows
    }
  }

  /**
   * Generate a stable source key from record fields.
   */
  private generateSourceKey(record: Record<string, unknown>): string | null {
    const code = record.factory_code as string
    const name = record.factory_name as string
    const city = record.city as string
    
    if (!code && !name) return null
    
    // Use factory_code as primary key if available
    if (code) return `code:${code.trim().toLowerCase()}`
    
    // Fallback to composite key
    return `name:${(name || '').trim().toLowerCase()}:city:${(city || '').trim().toLowerCase()}`
  }

  /**
   * Check if a record has changed compared to existing data.
   */
  private hasChanged(existing: Record<string, unknown>, incoming: Record<string, unknown>): boolean {
    return (
      (existing.factory_code || '') !== (incoming.factory_code || '') ||
      (existing.factory_name || '') !== (incoming.factory_name || '') ||
      (existing.city || '') !== (incoming.city || '') ||
      (existing.product || '') !== (incoming.product || '') ||
      (existing.hs_code || '') !== (incoming.hs_code || '')
    )
  }

  /**
   * Get import history.
   */
  async getImportHistory(context: RequestContext, limit: number = 20): Promise<FactoryCodeImport[]> {
    const { data, error } = await (this.supabase as any)
      .from('factory_code_imports')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw handleSupabaseError(error)
    }

    return data || []
  }
}

// Singleton instance
let factoryCodeServiceInstance: FactoryCodeService | null = null

export function getFactoryCodeService(): FactoryCodeService {
  if (!factoryCodeServiceInstance) {
    factoryCodeServiceInstance = new FactoryCodeService()
  }
  return factoryCodeServiceInstance
}
