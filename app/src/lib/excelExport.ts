import * as XLSX from 'xlsx'

/**
 * Generic Excel export helper.
 * Creates a workbook with proper column widths, auto-filter, and frozen header row.
 * Code/phone-like fields are stored as TEXT to prevent Excel corruption.
 */
export function exportToExcel(
  headers: string[],
  rows: any[][],
  sheetName: string,
  filename: string
) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // Auto-fit column widths
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = header.length
    for (const row of rows) {
      const cell = row[colIdx]
      if (cell != null) {
        const len = String(cell).length
        if (len > maxLen) maxLen = len
      }
    }
    // Add padding, cap at 50
    return { wch: Math.min(maxLen + 2, 50) }
  })
  ws['!cols'] = colWidths

  // Enable auto-filter on the header row
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: headers.length - 1, r: rows.length } }) }

  // Freeze header row (first row)
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  // Mark code/phone-like fields as TEXT to prevent Excel number corruption
  // These are typically columns with numeric codes that should stay as strings
  const textColumns = new Set<number>()
  headers.forEach((header, idx) => {
    const lower = header.toLowerCase()
    if (
      lower.includes('code') ||
      lower.includes('number') ||
      lower.includes('phone') ||
      lower.includes('registration')
    ) {
      textColumns.add(idx)
    }
  })

  // Rebuild sheet with text-type cells for code columns
  if (textColumns.size > 0) {
    const range = XLSX.utils.decode_range(ws['!ref']!)
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (const c of textColumns) {
        const addr = XLSX.utils.encode_cell({ r, c })
        const cell = ws[addr]
        if (cell && cell.v != null) {
          cell.t = 's'
          cell.v = String(cell.v)
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/**
 * Factory Code column definitions and record-to-row mapper.
 */
const FACTORY_CODE_HEADERS = [
  'Factory Code',
  'Factory Name (EN)',
  'Factory Name (AR)',
  'City',
  'Region',
  'Activity',
  'Product',
  'HS Code',
  'Registration Number',
]

function factoryCodeRecordToRow(record: any): any[] {
  return [
    record.factory_code ?? '',
    record.factory_name ?? '',
    record.factory_name_ar ?? '',
    record.city ?? '',
    record.region ?? '',
    record.activity ?? '',
    record.product ?? '',
    record.hs_code ?? '',
    record.registration_number ?? '',
  ]
}

/**
 * Export filtered (searched) factory code records to Excel.
 */
export function exportFactoryCodeFiltered(data: any[], filename?: string) {
  const rows = data.map(factoryCodeRecordToRow)
  exportToExcel(
    FACTORY_CODE_HEADERS,
    rows,
    'Factory Code (Filtered)',
    filename ?? 'factory-code-filtered'
  )
}

/**
 * Export the full factory code master database to Excel.
 */
export function exportFactoryCodeFull(data: any[], filename?: string) {
  const rows = data.map(factoryCodeRecordToRow)
  exportToExcel(
    FACTORY_CODE_HEADERS,
    rows,
    'Factory Code (Master)',
    filename ?? 'factory-code-full'
  )
}
