/**
 * Shared Project Data Engine for SANAD application.
 * 
 * Implements the core business rule: detecting conflicts between
 * document values and project shared data, with a two-step
 * confirmation workflow for synchronization.
 * 
 * This is the most important business rule in SANAD.
 * It must NOT be rushed.
 */

import { getSupabase, type Database } from '../supabase'
import { type RequestContext } from '../api'
import { handleSupabaseError } from '../errors'
import { appLogger } from '../logger'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===========================================
// Types
// ===========================================

export type FieldCategory = 'shared' | 'document_specific' | 'derived'

export interface FieldDefinition {
  key: string
  category: FieldCategory
  label: string
  labelAr: string
}

export interface SharedDataConflict {
  fieldKey: string
  fieldLabel: string
  projectValue: unknown
  documentValue: unknown
}

export interface ConflictResolution {
  keepDocumentOnly: boolean
  updateProject: boolean
  selectedDocumentIds: string[]
}

export interface SyncDocumentResult {
  documentId: string
  documentNumber: string
  success: boolean
  error?: string
}

export interface SynchronizationResult {
  updatedProject: boolean
  updatedDocuments: number
  failedDocuments: number
  documentResults: SyncDocumentResult[]
}

// ===========================================
// Shared Field Definitions
// ===========================================

// Material-level shared fields
export const MATERIAL_SHARED_FIELDS: FieldDefinition[] = [
  { key: 'quantity', category: 'shared', label: 'Quantity', labelAr: 'الكمية' },
  { key: 'unit_price', category: 'shared', label: 'Unit Price', labelAr: 'سعر الوحدة' },
  { key: 'currency', category: 'shared', label: 'Currency', labelAr: 'العملة' },
  { key: 'weight_unit', category: 'shared', label: 'Weight Unit', labelAr: 'وحدة الوزن' },
  { key: 'packing_unit', category: 'shared', label: 'Packing', labelAr: 'التعبئة' },
  { key: 'origin', category: 'shared', label: 'Origin', labelAr: 'المصدر' },
  { key: 'hs_code', category: 'shared', label: 'HS Code', labelAr: 'كود HS' },
]

// Document-level shared fields
export const DOCUMENT_SHARED_FIELDS: FieldDefinition[] = [
  { key: 'incoterm', category: 'shared', label: 'Incoterm', labelAr: 'الشروط التجارية' },
  { key: 'payment_terms', category: 'shared', label: 'Payment Terms', labelAr: 'شروط الدفع' },
  { key: 'delivery_terms', category: 'shared', label: 'Delivery Terms', labelAr: 'شروط التسليم' },
]

// ===========================================
// Shared Data Service
// ===========================================

export class SharedDataService {
  private supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabase()
  }

  /**
   * Detect conflicts between document values and project shared data.
   * 
   * Returns an array of conflicts found. Empty array means no conflicts.
   */
  detectConflicts(
    projectData: Record<string, unknown>,
    documentData: Record<string, unknown>
  ): SharedDataConflict[] {
    const conflicts: SharedDataConflict[] = []

    // Check material-level shared fields
    for (const field of MATERIAL_SHARED_FIELDS) {
      const projectValue = projectData[field.key]
      const documentValue = documentData[field.key]

      if (documentValue !== undefined && documentValue !== null && projectValue !== undefined && projectValue !== null) {
        if (String(projectValue) !== String(documentValue)) {
          conflicts.push({
            fieldKey: field.key,
            fieldLabel: field.label,
            projectValue,
            documentValue,
          })
        }
      }
    }

    // Check document-level shared fields
    for (const field of DOCUMENT_SHARED_FIELDS) {
      const projectValue = projectData[field.key]
      const documentValue = documentData[field.key]

      if (documentValue !== undefined && documentValue !== null && projectValue !== undefined && projectValue !== null) {
        if (String(projectValue) !== String(documentValue)) {
          conflicts.push({
            fieldKey: field.key,
            fieldLabel: field.label,
            projectValue,
            documentValue,
          })
        }
      }
    }

    return conflicts
  }

  /**
   * Find affected documents that share conflicting field values.
   * 
   * Returns documents that would need to be synchronized if the project
   * shared data is updated.
   */
  async findAffectedDocuments(
    workItemId: string,
    conflicts: SharedDataConflict[],
    excludeDocumentId: string | null
  ): Promise<Array<{ id: string; number: string; type: string }>> {
    const { data: documents, error } = await (this.supabase as any)
      .from('documents')
      .select('id, document_number, document_type')
      .eq('work_item_id', workItemId)
      .is('deleted_at', null)

    if (error || !documents) {
      return []
    }

    // For each document, check if any conflicting field matches the current project value
    const affected: Array<{ id: string; number: string; type: string }> = []

    for (const doc of documents) {
      // Skip the document being edited
      if (excludeDocumentId && doc.id === excludeDocumentId) continue

      const docData = (doc as any).document_data || {}
      let hasConflict = false

      for (const conflict of conflicts) {
        // If the document has the same value as the CURRENT project value,
        // it means the document was in sync before the user tried to change it
        const docValue = docData[conflict.fieldKey]
        if (docValue !== undefined && String(docValue) === String(conflict.projectValue)) {
          hasConflict = true
          break
        }
      }

      if (hasConflict) {
        affected.push({
          id: doc.id,
          number: doc.document_number,
          type: doc.document_type,
        })
      }
    }

    return affected
  }

  /**
   * Update project shared data and synchronize selected documents.
   * 
   * Uses compensating rollback: if any document update fails, the project
   * update and all already-updated documents are rolled back to their
   * original values. This prevents partial synchronization.
   */
  async synchronizeData(
    workItemId: string,
    conflicts: SharedDataConflict[],
    selectedDocumentIds: string[],
    context: RequestContext
  ): Promise<SynchronizationResult> {
    appLogger.info('Starting shared data synchronization', {
      workItemId,
      conflictCount: conflicts.length,
      selectedDocCount: selectedDocumentIds.length,
    })

    if (conflicts.length === 0 || selectedDocumentIds.length === 0) {
      return { updatedProject: false, updatedDocuments: 0, failedDocuments: 0, documentResults: [] }
    }

    // Step 1: Snapshot current project state for rollback
    const { data: projectSnapshot, error: snapshotError } = await (this.supabase as any)
      .from('work_items')
      .select('*')
      .eq('id', workItemId)
      .single()

    if (snapshotError || !projectSnapshot) {
      throw handleSupabaseError(snapshotError || new Error('Project not found'))
    }

    // Step 2: Snapshot current document states for rollback
    const docSnapshots: Record<string, any> = {}
    for (const docId of selectedDocumentIds) {
      const { data: doc } = await (this.supabase as any)
        .from('documents')
        .select('id, document_data')
        .eq('id', docId)
        .single()
      if (doc) docSnapshots[docId] = { document_data: { ...((doc as any).document_data || {}) } }
    }

    // Step 3: Update project shared fields
    const projectUpdateData: Record<string, unknown> = {}
    for (const conflict of conflicts) {
      projectUpdateData[conflict.fieldKey] = conflict.documentValue
    }

    const { error: projectError } = await (this.supabase as any)
      .from('work_items')
      .update(projectUpdateData)
      .eq('id', workItemId)

    if (projectError) {
      appLogger.error('Failed to update project shared data', projectError)
      throw handleSupabaseError(projectError)
    }

    // Step 4: Update documents one-by-one, tracking successes for rollback
    const documentResults: SyncDocumentResult[] = []
    const updatedDocIds: string[] = []
    let updatedCount = 0
    let failedCount = 0
    let anyFailed = false

    for (const docId of selectedDocumentIds) {
      try {
        const snapshot = docSnapshots[docId]
        if (!snapshot) {
          documentResults.push({ documentId: docId, documentNumber: docId, success: false, error: 'Document snapshot not found' })
          failedCount++
          anyFailed = true
          continue
        }

        const docData = { ...(snapshot.document_data || {}) }
        for (const conflict of conflicts) {
          if (docData[conflict.fieldKey] !== undefined) {
            docData[conflict.fieldKey] = conflict.documentValue
          }
        }

        const { error: docError } = await (this.supabase as any)
          .from('documents')
          .update({ document_data: docData, updated_by: context.userId })
          .eq('id', docId)

        if (docError) {
          documentResults.push({ documentId: docId, documentNumber: docId, success: false, error: docError.message })
          failedCount++
          anyFailed = true
          appLogger.error('Failed to update document in sync', { docId, error: docError })
        } else {
          documentResults.push({ documentId: docId, documentNumber: docId, success: true })
          updatedDocIds.push(docId)
          updatedCount++
        }
      } catch (err: any) {
        documentResults.push({ documentId: docId, documentNumber: docId, success: false, error: err?.message || 'Unknown error' })
        failedCount++
        anyFailed = true
        appLogger.error('Unexpected error syncing document', { docId, error: err })
      }
    }

    // Step 5: Compensating rollback if any document failed
    if (anyFailed) {
      appLogger.warn('Rolling back shared data sync due to document failure', {
        workItemId,
        failedCount,
        rollingBackProject: true,
        rollingBackDocs: updatedDocIds.length,
      })

      // Rollback project
      const rollbackData: Record<string, unknown> = {}
      for (const conflict of conflicts) {
        rollbackData[conflict.fieldKey] = projectSnapshot[conflict.fieldKey]
      }
      await (this.supabase as any)
        .from('work_items')
        .update(rollbackData)
        .eq('id', workItemId)

      // Rollback already-updated documents
      for (const docId of updatedDocIds) {
        const snapshot = docSnapshots[docId]
        if (snapshot) {
          await (this.supabase as any)
            .from('documents')
            .update({ document_data: snapshot.document_data, updated_by: context.userId })
            .eq('id', docId)
        }
      }

      // Mark rolled-back documents as failed in results
      for (const result of documentResults) {
        if (result.success && updatedDocIds.includes(result.documentId)) {
          result.success = false
          result.error = 'Rolled back due to other document failure'
        }
      }

      return {
        updatedProject: false,
        updatedDocuments: 0,
        failedDocuments: selectedDocumentIds.length,
        documentResults,
      }
    }

    appLogger.info('Shared data synchronization complete', {
      workItemId,
      updatedDocuments: updatedCount,
      failedDocuments: failedCount,
      totalAttempted: selectedDocumentIds.length,
    })

    return {
      updatedProject: true,
      updatedDocuments: updatedCount,
      failedDocuments: failedCount,
      documentResults,
    }
  }

  /**
   * Audit a document update for shared data changes.
   */
  private async auditDocumentUpdate(
    documentId: string,
    workItemId: string,
    conflicts: SharedDataConflict[],
    context: RequestContext,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    const statusLabel = success ? 'SUCCESS' : 'FAILED'
    for (const conflict of conflicts) {
      await (this.supabase as any)
        .from('audit_events')
        .insert({
          company_id: context.companyId!,
          actor_user_id: context.userId,
          action: 'EDIT',
          entity_type: 'document',
          entity_id: documentId,
          entity_ref: `Shared data sync [${statusLabel}] for field: ${conflict.fieldKey}`,
          before_json: { [conflict.fieldKey]: conflict.projectValue },
          after_json: success
            ? { [conflict.fieldKey]: conflict.documentValue }
            : { [conflict.fieldKey]: conflict.projectValue, _sync_error: errorMessage || 'Update failed' },
        })
    }
  }

  /**
   * Get shared field definitions.
   */
  getSharedFieldDefinitions(): FieldDefinition[] {
    return [...MATERIAL_SHARED_FIELDS, ...DOCUMENT_SHARED_FIELDS]
  }

  /**
   * Check if a field is shared (participates in synchronization).
   */
  isSharedField(fieldKey: string): boolean {
    const allShared = this.getSharedFieldDefinitions()
    return allShared.some(f => f.key === fieldKey)
  }
}

// Singleton instance
let sharedDataServiceInstance: SharedDataService | null = null

export function getSharedDataService(): SharedDataService {
  if (!sharedDataServiceInstance) {
    sharedDataServiceInstance = new SharedDataService()
  }
  return sharedDataServiceInstance
}
