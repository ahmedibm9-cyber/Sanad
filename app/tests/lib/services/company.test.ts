/**
 * Tests for company service.
 */

import { describe, it, expect, vi } from 'vitest'

// Create a proper mock for the Supabase builder pattern
function createMockSupabase() {
  const createChain = () => {
    const chain: Record<string, any> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.insert = vi.fn().mockReturnValue(chain)
    chain.update = vi.fn().mockReturnValue(chain)
    chain.delete = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.neq = vi.fn().mockReturnValue(chain)
    chain.in = vi.fn().mockReturnValue(chain)
    chain.order = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockResolvedValue({ data: null, error: null })
    chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    return chain
  }

  return {
    from: vi.fn().mockReturnValue(createChain()),
  }
}

const mockSupabase = createMockSupabase()

vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(() => mockSupabase),
}))

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('CompanyService', () => {
  it('should create a company', async () => {
    const { CompanyService } = await import('@/lib/services/company')
    const service = new CompanyService()

    const mockCompany = {
      id: 'new-company',
      name_en: 'New Company',
      name_ar: 'شركة جديدة',
      short_name: 'NC',
      company_code: 'NC01',
      active: true,
    }

    // Setup mock chain
    const chain = mockSupabase.from()
    chain.select.mockReturnValue(chain)
    chain.eq.mockReturnValue(chain)
    chain.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })

    // Second call for insert
    mockSupabase.from.mockReturnValue({
      ...chain,
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockCompany, error: null }),
        }),
      }),
    })

    const result = await service.createCompany({
      name_en: 'New Company',
      name_ar: 'شركة جديدة',
      short_name: 'NC',
      company_code: 'NC01',
    }, {
      userId: 'user-1',
      companyId: '1',
      permissions: { 'company.edit': true },
      isSystemAdmin: false,
    })

    expect(result.name_en).toBe('New Company')
  })

  it('should get companies for admin', async () => {
    const { CompanyService } = await import('@/lib/services/company')
    const service = new CompanyService()

    const companies = [
      { id: '1', name_en: 'Company 1', active: true },
      { id: '2', name_en: 'Company 2', active: true },
    ]

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: companies, error: null }),
        }),
      }),
    })

    const result = await service.getUserCompanies({
      userId: 'user-1',
      companyId: '1',
      permissions: {},
      isSystemAdmin: true,
    })

    expect(result).toHaveLength(2)
  })
})
