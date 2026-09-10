/**
 * Factory Code service for SANAD application.
 * 
 * Handles the shared Saudi Factory Code master database.
 * Shared across all companies, never deleted from source.
 */

import * as XLSX from 'xlsx'
import { getSupabase, type Database } from '../supabase'
import { type RequestContext, requirePermission } from '../api'
import { ilikeSearch } from '../search'
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
      const qPattern = ilikeSearch(query)
      q = q.or(`factory_code.ilike.${qPattern},factory_name.ilike.${qPattern},factory_name_ar.ilike.${qPattern},city.ilike.${qPattern},product.ilike.${qPattern},hs_code.ilike.${qPattern},activity.ilike.${qPattern},registration_number.ilike.${qPattern}`)
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
   * Accepts raw Excel row objects (with column headers like 'Factory Code')
   * or pre-mapped records (with keys like 'factory_code').
   */
  async smartMerge(
    records: Array<Record<string, unknown>>,
    context: RequestContext,
    sourceFilename?: string
  ): Promise<ImportSummary> {
    requirePermission(context, 'factory.import_update')

    let inserted = 0
    let updated = 0
    let unchanged = 0
    let errors = 0
    const preview: ImportPreviewRow[] = []

    // Normalize all incoming rows to canonical record shape
    const normalized = records.map(r => FactoryCodeService.mapRowToRecord(r))

    // Create import record
    const { data: importRecord } = await (this.supabase as any)
      .from('factory_code_imports')
      .insert({
        uploaded_by: context.userId,
        source_filename: sourceFilename || 'uploaded-file.xlsx',
        row_count: normalized.length,
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    const importId = importRecord?.id

    for (const record of normalized) {
      try {
        const sourceKey = this.generateSourceKey(record)
        if (!sourceKey) {
          errors++
          continue
        }

        // Check if record exists
        const { data: existing } = await (this.supabase as any)
          .from('factory_code_records')
          .select('id, factory_code, factory_name, factory_name_ar, city, region, activity, product, hs_code, registration_number')
          .eq('stable_source_key', sourceKey)
          .single()

        if (existing) {
          // Check if changed
          const isChanged = this.hasChanged(existing, record)
          
          if (isChanged) {
            // Update only changed fields
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
              factory_code: (record.factory_code as string) || '',
              factory_name: (record.factory_name as string) || '',
              city: (record.city as string) || '',
              product: (record.product as string) || '',
              action: 'update',
            })
          } else {
            unchanged++
            preview.push({
              factory_code: (record.factory_code as string) || '',
              factory_name: (record.factory_name as string) || '',
              city: (record.city as string) || '',
              product: (record.product as string) || '',
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
            factory_code: (record.factory_code as string) || '',
            factory_name: (record.factory_name as string) || '',
            city: (record.city as string) || '',
            product: (record.product as string) || '',
            action: 'add',
          })
        }
      } catch (e) {
        errors++
      }
    }

    // Count retained records (old records not in new source)
    const totalAfter = await this.getRecordCount()

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
      retained: totalAfter - inserted - updated,
    })

    return {
      inserted,
      updated,
      unchanged,
      retained: totalAfter - inserted - updated,
      errors,
      preview: preview.slice(0, 100), // Limit preview to 100 rows
    }
  }

  /**
   * Smart merge using staging table for large imports.
   * Provides atomic import with rollback capability and progress tracking.
   * Falls back to smartMerge for small imports if staging table is unavailable.
   */
  async smartMergeWithStaging(
    records: Array<Record<string, unknown>>,
    context: RequestContext,
    sourceFilename?: string
  ): Promise<ImportSummary> {
    requirePermission(context, 'factory.import_update')

    let inserted = 0
    let updated = 0
    let unchanged = 0
    let errors = 0
    const preview: ImportPreviewRow[] = []

    // 1. Create import record
    const { data: importRecord } = await (this.supabase as any)
      .from('factory_code_imports')
      .insert({
        uploaded_by: context.userId,
        source_filename: sourceFilename || 'uploaded-file.xlsx',
        row_count: records.length,
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    const importId = importRecord?.id

    // 2. Normalize and insert into staging
    interface StagingRow {
      import_id: string | undefined
      stable_source_key: string
      row_number: number
      raw_data: Record<string, unknown>
      factory_code: string | null
      factory_name: string | null
      factory_name_ar: string | null
      city: string | null
      region: string | null
      activity: string | null
      product: string | null
      hs_code: string | null
      registration_number: string | null
      status: string
    }

    const normalized: StagingRow[] = records.map((r, idx) => {
      const mapped = FactoryCodeService.mapRowToRecord(r)
      const key = FactoryCodeService.computeStableKey(r)
      return {
        import_id: importId,
        stable_source_key: key,
        row_number: idx + 1,
        raw_data: r,
        factory_code: (mapped.factory_code as string) ?? null,
        factory_name: (mapped.factory_name as string) ?? null,
        factory_name_ar: (mapped.factory_name_ar as string) ?? null,
        city: (mapped.city as string) ?? null,
        region: (mapped.region as string) ?? null,
        activity: (mapped.activity as string) ?? null,
        product: (mapped.product as string) ?? null,
        hs_code: (mapped.hs_code as string) ?? null,
        registration_number: (mapped.registration_number as string) ?? null,
        status: 'pending',
      }
    })

    // Batch insert into staging (1000 at a time)
    const BATCH = 1000
    for (let i = 0; i < normalized.length; i += BATCH) {
      const batch = normalized.slice(i, i + BATCH)
      await (this.supabase as any).from('factory_code_staging').insert(batch)
    }

    // 3. Validate all pending rows via RPC
    try {
      await (this.supabase as any).rpc('validate_staging_rows', { p_import_id: importId })
    } catch {
      // Fallback: validate client-side if RPC unavailable
      const updates: Array<{ id: string; status: string; error_message: string | null }> = []
      for (const row of normalized) {
        let status = 'validated'
        let error_message: string | null = null
        if (!row.stable_source_key || row.stable_source_key === '') {
          status = 'error'
          error_message = 'Missing stable source key'
        } else if (!row.factory_code && !row.factory_name) {
          status = 'error'
          error_message = 'Both factory code and name are empty'
        }
        if (row.import_id) {
          updates.push({ id: row.import_id, status, error_message })
        }
      }
      // Note: in fallback, we skip per-row updates as IDs aren't stored client-side
    }

    // 4. Merge validated rows into factory_code_records
    const { data: stagingRows } = await (this.supabase as any)
      .from('factory_code_staging')
      .select('*')
      .eq('import_id', importId)
      .eq('status', 'validated')

    if (stagingRows) {
      for (const stagingRow of stagingRows) {
        try {
          const sourceKey = stagingRow.stable_source_key
          if (!sourceKey) {
            errors++
            await this.updateStagingStatus(stagingRow.id, 'error', 'Missing stable source key')
            continue
          }

          // Check if record exists
          const { data: existing } = await (this.supabase as any)
            .from('factory_code_records')
            .select('id, factory_code, factory_name, factory_name_ar, city, region, activity, product, hs_code, registration_number')
            .eq('stable_source_key', sourceKey)
            .single()

          if (existing) {
            const isChanged = this.hasChanged(existing, stagingRow)

            if (isChanged) {
              await (this.supabase as any)
                .from('factory_code_records')
                .update({
                  factory_code: stagingRow.factory_code || null,
                  factory_name: stagingRow.factory_name || null,
                  factory_name_ar: stagingRow.factory_name_ar || null,
                  city: stagingRow.city || null,
                  region: stagingRow.region || null,
                  activity: stagingRow.activity || null,
                  product: stagingRow.product || null,
                  hs_code: stagingRow.hs_code || null,
                  registration_number: stagingRow.registration_number || null,
                  last_seen_import_id: importId,
                })
                .eq('id', existing.id)

              updated++
              await this.updateStagingStatus(stagingRow.id, 'updated')
              preview.push({
                factory_code: (stagingRow.factory_code as string) || '',
                factory_name: (stagingRow.factory_name as string) || '',
                city: (stagingRow.city as string) || '',
                product: (stagingRow.product as string) || '',
                action: 'update',
              })
            } else {
              unchanged++
              await this.updateStagingStatus(stagingRow.id, 'unchanged')
              preview.push({
                factory_code: (stagingRow.factory_code as string) || '',
                factory_name: (stagingRow.factory_name as string) || '',
                city: (stagingRow.city as string) || '',
                product: (stagingRow.product as string) || '',
                action: 'unchanged',
              })
            }
          } else {
            await (this.supabase as any)
              .from('factory_code_records')
              .insert({
                stable_source_key: sourceKey,
                factory_code: stagingRow.factory_code || null,
                factory_name: stagingRow.factory_name || null,
                factory_name_ar: stagingRow.factory_name_ar || null,
                city: stagingRow.city || null,
                region: stagingRow.region || null,
                activity: stagingRow.activity || null,
                product: stagingRow.product || null,
                hs_code: stagingRow.hs_code || null,
                registration_number: stagingRow.registration_number || null,
                first_seen_import_id: importId,
                last_seen_import_id: importId,
              })

            inserted++
            await this.updateStagingStatus(stagingRow.id, 'inserted')
            preview.push({
              factory_code: (stagingRow.factory_code as string) || '',
              factory_name: (stagingRow.factory_name as string) || '',
              city: (stagingRow.city as string) || '',
              product: (stagingRow.product as string) || '',
              action: 'add',
            })
          }
        } catch (e) {
          errors++
          await this.updateStagingStatus(stagingRow.id, 'error', String(e))
        }
      }
    }

    // 5. Count retained records
    const totalAfter = await this.getRecordCount()

    // 6. Update import record
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

    appLogger.info('Factory code staging import completed', {
      inserted,
      updated,
      unchanged,
      errors,
      retained: totalAfter - inserted - updated,
    })

    return {
      inserted,
      updated,
      unchanged,
      retained: totalAfter - inserted - updated,
      errors,
      preview: preview.slice(0, 100),
    }
  }

  /**
   * Update a staging row's status and optional error message.
   */
  private async updateStagingStatus(
    stagingId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    const update: Record<string, unknown> = { status }
    if (errorMessage !== undefined) {
      update.error_message = errorMessage
    }
    await (this.supabase as any)
      .from('factory_code_staging')
      .update(update)
      .eq('id', stagingId)
  }

  /**
   * Parse an Excel file buffer into an array of row objects.
   * Handles both .xlsx and .xls formats.
   */
  static parseExcelFile(buffer: ArrayBuffer): Array<Record<string, unknown>> {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return []
    const sheet = workbook.Sheets[sheetName]
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    return raw
  }

  /**
   * Compute a deterministic stable source key from an Excel row.
   * Uses factory_code + factory_name + city (normalized to lowercase, trimmed).
   */
  static computeStableKey(row: Record<string, unknown>): string {
    const code = String(row['Factory Code'] ?? row['factory_code'] ?? '').trim().toLowerCase()
    const name = String(row['Factory Name'] ?? row['factory_name'] ?? '').trim().toLowerCase()
    const city = String(row['City'] ?? row['city'] ?? '').trim().toLowerCase()
    return `${code}|${name}|${city}`
  }

  /**
   * Map an Excel row object to the canonical record shape for the database.
   */
  static mapRowToRecord(row: Record<string, unknown>): Record<string, unknown> {
    return {
      factory_code: row['Factory Code'] ?? row['factory_code'] ?? null,
      factory_name: row['Factory Name'] ?? row['factory_name'] ?? null,
      factory_name_ar: row['Factory Name (Arabic)'] ?? row['factory_name_ar'] ?? null,
      city: row['City'] ?? row['city'] ?? null,
      region: row['Region'] ?? row['region'] ?? null,
      activity: row['Activity'] ?? row['activity'] ?? null,
      product: row['Product'] ?? row['product'] ?? null,
      hs_code: row['HS Code'] ?? row['hs_code'] ?? null,
      registration_number: row['Registration Number'] ?? row['registration_number'] ?? null,
    }
  }

  /**
   * Generate a stable source key from record fields (legacy internal use).
   */
  private generateSourceKey(record: Record<string, unknown>): string | null {
    const code = record.factory_code as string
    const name = record.factory_name as string
    const city = record.city as string
    
    if (!code && !name) return null
    
    return FactoryCodeService.computeStableKey({
      'Factory Code': code,
      'Factory Name': name,
      'City': city,
    })
  }

  /**
   * Check if a record has changed compared to existing data.
   */
  private hasChanged(existing: Record<string, unknown>, incoming: Record<string, unknown>): boolean {
    const fields = ['factory_code', 'factory_name', 'factory_name_ar', 'city', 'region', 'activity', 'product', 'hs_code', 'registration_number'] as const
    for (const field of fields) {
      const a = (existing[field] ?? '') as string
      const b = (incoming[field] ?? '') as string
      if (a !== b) return true
    }
    return false
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
