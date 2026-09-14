/** Maps the modal's UI model to the work-item service contract. */
export function toWorkItemInput(form: Record<string, any>) {
  return {
    name: form.name?.trim(),
    customer_id: form.customerId || null,
    destination_country: form.destinationCountry || null,
    destination_city: form.destinationCity || null,
    currency: form.currency || null,
    incoterm: form.incoterm || null,
    payment_terms: form.paymentTerms || null,
    delivery_terms: form.deliveryTerms || null,
    port_of_loading: form.portOfLoading || null,
    port_of_discharge: form.portOfDischarge || null,
    vessel_name: form.vesselName || null,
    voyage_number: form.voyageNumber || null,
    container_number: form.containerNumber || null,
    materials: (form.materials || []).map((line: Record<string, any>, index: number) => ({
      material_id: line.materialId || null,
      description_override: line.materialName || null,
      quantity: Number(line.quantity) || 0,
      weight_unit: line.weightUnit || 'MT',
      price: Number(line.unitPrice) || 0,
      currency: line.currency || form.currency || 'SAR',
      packing_unit: line.packingUnit || null,
      packing_description: line.packing || null,
      origin: line.origin || null,
      hs_code: line.hsCode || null,
      sort_order: index,
    })),
  }
}
