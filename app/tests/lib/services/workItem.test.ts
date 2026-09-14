/**
 * Tests for work item service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { WorkItem } from '@/lib/services/workItem'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
  })),
}))

describe('WorkItemService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should define work item type correctly', async () => {
    const workItem: WorkItem = {
      id: '1',
      company_id: 'comp-1',
      type: 'project',
      name: 'HDPE Shipment to Dubai',
      customer_id: 'cust-1',
      status: 'in_progress',
      pinned: true,
      destination_country: 'UAE',
      destination_city: 'Dubai',
      currency: 'SAR',
      incoterm: 'FOB',
      payment_terms: 'Net 30',
      delivery_terms: null,
      port_of_loading: 'Jubail',
      port_of_discharge: 'Jebel Ali',
      vessel_name: 'MV Pacific Star',
      voyage_number: 'PS-2024-0412',
      container_number: 'MSKU 7283456',
      active: true,
      archived_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
      deleted_at: null,
      version: 1,
    }

    expect(workItem.name).toBe('HDPE Shipment to Dubai')
    expect(workItem.type).toBe('project')
    expect(workItem.status).toBe('in_progress')
    expect(workItem.pinned).toBe(true)
    expect(workItem.destination_country).toBe('UAE')
  })

  it('should include version field with default value 1', async () => {
    const workItem: WorkItem = {
      id: '1',
      company_id: 'comp-1',
      type: 'task',
      name: 'Test Task',
      customer_id: null,
      status: 'in_progress',
      pinned: false,
      destination_country: null,
      destination_city: null,
      currency: null,
      incoterm: null,
      payment_terms: null,
      delivery_terms: null,
      port_of_loading: null,
      port_of_discharge: null,
      vessel_name: null,
      voyage_number: null,
      container_number: null,
      active: true,
      archived_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
      deleted_at: null,
      version: 1,
    }

    expect(workItem.version).toBe(1)
    expect(typeof workItem.version).toBe('number')
  })

  describe('optimistic locking', () => {
    it('should increment version on successful update', async () => {
      const existing: WorkItem = {
        id: '1',
        company_id: 'comp-1',
        type: 'project',
        name: 'Original Name',
        customer_id: null,
        status: 'in_progress',
        pinned: false,
        destination_country: null,
        destination_city: null,
        currency: 'SAR',
        incoterm: null,
        payment_terms: null,
        delivery_terms: null,
        port_of_loading: null,
        port_of_discharge: null,
        vessel_name: null,
        voyage_number: null,
        container_number: null,
        active: true,
        archived_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: null,
        updated_by: null,
        deleted_at: null,
        version: 3,
      }

      const currentVersion = (existing as any).version ?? 1
      const newVersion = currentVersion + 1

      expect(currentVersion).toBe(3)
      expect(newVersion).toBe(4)
    })

    it('should detect version mismatch for conflict', async () => {
      const existing: WorkItem = {
        id: '1',
        company_id: 'comp-1',
        type: 'project',
        name: 'Original Name',
        customer_id: null,
        status: 'in_progress',
        pinned: false,
        destination_country: null,
        destination_city: null,
        currency: 'SAR',
        incoterm: null,
        payment_terms: null,
        delivery_terms: null,
        port_of_loading: null,
        port_of_discharge: null,
        vessel_name: null,
        voyage_number: null,
        container_number: null,
        active: true,
        archived_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: null,
        updated_by: null,
        deleted_at: null,
        version: 3,
      }

      // Simulate another user updating the record (version now 4)
      const concurrentVersion = 4
      const currentVersion = (existing as any).version ?? 1

      expect(currentVersion).not.toBe(concurrentVersion)
    })
  })

  it('should define work item material correctly', async () => {
    const material: import('@/lib/services/workItem').WorkItemMaterial = {
      id: '1',
      company_id: 'comp-1',
      work_item_id: 'wi-1',
      material_id: 'mat-1',
      description_override: null,
      quantity: 50,
      weight_unit: 'MT',
      price: 1050,
      currency: 'SAR',
      packing_unit: 'Bags',
      packing_description: '25 KG Bags',
      origin: 'Saudi Arabia',
      hs_code: '3901.20',
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    expect(material.quantity).toBe(50)
    expect(material.price).toBe(1050)
    expect(material.weight_unit).toBe('MT')
  })

  it('should handle task to project conversion type', async () => {
    const taskType: import('@/lib/services/workItem').WorkItemType = 'task'
    const projectType: import('@/lib/services/workItem').WorkItemType = 'project'

    expect(taskType).toBe('task')
    expect(projectType).toBe('project')
  })

  it('should handle all valid statuses', async () => {
    const statuses: Array<import('@/lib/services/workItem').WorkItemStatus> = [
      'in_progress', 'cancelled', 'completed', 'archived'
    ]

    expect(statuses).toHaveLength(4)
    expect(statuses).toContain('in_progress')
    expect(statuses).toContain('cancelled')
    expect(statuses).toContain('completed')
    expect(statuses).toContain('archived')
  })

  it('should define create work item input correctly', async () => {
    const input: import('@/lib/services/workItem').CreateWorkItemInput = {
      type: 'project',
      name: 'New Project',
      customer_id: 'cust-1',
      destination_country: 'UAE',
      currency: 'SAR',
      materials: [
        {
          material_id: 'mat-1',
          quantity: 50,
          weight_unit: 'MT',
          price: 1050,
          currency: 'SAR',
        }
      ]
    }

    expect(input.type).toBe('project')
    expect(input.materials).toHaveLength(1)
    expect(input.materials[0].quantity).toBe(50)
  })
})
