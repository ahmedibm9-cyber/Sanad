import { describe, expect, it } from 'vitest'
import { toWorkItemInput } from '../../src/lib/workItemForm'

describe('toWorkItemInput', () => {
  it('maps the project form fields to the persisted work-item contract', () => {
    expect(toWorkItemInput({
      name: 'Jeddah shipment',
      customerId: 'customer-1',
      destinationCountry: 'Saudi Arabia',
      destinationCity: 'Jeddah',
      paymentTerms: 'Net 30 days',
      portOfLoading: 'Jeddah',
      materials: [{ materialId: 'material-1', quantity: 4, unitPrice: 25 }],
    })).toMatchObject({
      name: 'Jeddah shipment',
      customer_id: 'customer-1',
      destination_country: 'Saudi Arabia',
      destination_city: 'Jeddah',
      payment_terms: 'Net 30 days',
      port_of_loading: 'Jeddah',
      materials: [{ material_id: 'material-1', quantity: 4, price: 25 }],
    })
  })
})
