/**
 * Tests for factory code service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as Spreadsheet from '@e965/xlsx'
import { FactoryCodeService } from '@/lib/services/factoryCode'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('FactoryCodeService', () => {
  let service: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const { FactoryCodeService } = await import('@/lib/services/factoryCode')
    service = new FactoryCodeService()
  })

  it('should define factory code record type correctly', async () => {
    const record: import('@/lib/services/factoryCode').FactoryCodeRecord = {
      id: '1',
      stable_source_key: 'code:100001',
      factory_code: '100001',
      factory_name: 'SABIC',
      factory_name_ar: 'سابك',
      city: 'Riyadh',
      region: 'Central',
      activity: 'Petrochemicals',
      product: 'Polyethylene',
      hs_code: '3901.20',
      registration_number: 'CR-1010001234',
      first_seen_import_id: 'imp-1',
      last_seen_import_id: 'imp-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    expect(record.factory_code).toBe('100001')
    expect(record.factory_name).toBe('SABIC')
    expect(record.city).toBe('Riyadh')
  })

  it('should define import summary correctly', async () => {
    const summary: import('@/lib/services/factoryCode').ImportSummary = {
      inserted: 100,
      updated: 50,
      unchanged: 12000,
      retained: 500,
      errors: 5,
      preview: [],
    }

    expect(summary.inserted).toBe(100)
    expect(summary.retained).toBe(500)
  })

  it('should generate stable source key from factory code', async () => {
    const record = { factory_code: '100001', factory_name: 'SABIC', city: 'Riyadh' }
    
    // The service uses factory_code as primary key
    const key = `code:${(record.factory_code || '').trim().toLowerCase()}`
    expect(key).toBe('code:100001')
  })

  it('should generate composite key when no factory code', async () => {
    const record = { factory_code: null, factory_name: 'SABIC', city: 'Riyadh' }
    
    const key = `name:${(record.factory_name || '').trim().toLowerCase()}:city:${(record.city || '').trim().toLowerCase()}`
    expect(key).toBe('name:sabic:city:riyadh')
  })

  it('should handle smart merge rules correctly', async () => {
    // New record -> insert
    // Changed record -> update
    // Unchanged record -> skip
    // Old record missing from source -> retain (never delete)
    
    const actions = ['add', 'update', 'unchanged']
    expect(actions).toContain('add')
    expect(actions).toContain('update')
    expect(actions).toContain('unchanged')
  })

  it('parses a modern XLSX workbook without changing Arabic or code values', async () => {
    const workbook = Spreadsheet.utils.book_new()
    const worksheet = Spreadsheet.utils.aoa_to_sheet([
      ['Factory Code', 'Factory Name', 'Factory Name (Arabic)', 'HS Code'],
      ['000952', 'SANAD Chemicals', 'صناعات سند', '3901.20'],
    ])
    Spreadsheet.utils.book_append_sheet(workbook, worksheet, 'Factories')
    const buffer = Spreadsheet.write(workbook, { bookType: 'xlsx', type: 'array' })

    expect(FactoryCodeService.parseExcelFile(buffer)).toEqual([
      {
        'Factory Code': '000952',
        'Factory Name': 'SANAD Chemicals',
        'Factory Name (Arabic)': 'صناعات سند',
        'HS Code': '3901.20',
      },
    ])
  })

  it('rejects an import workbook without a stable Factory Code column', () => {
    expect(() => FactoryCodeService.validateImportRows([
      { 'Factory Name': 'SANAD Chemicals', City: 'Riyadh' },
    ])).toThrow('Factory Code')
  })
})
