# SANAD — Task / Project Workflow Specification

## 1. Unified work concept

Task and Project use the same underlying work-item model.

Task = small operation.
Project = larger operation.

Both can contain:
- customer
- materials
- documents
- attachments
- Notes
- Report Issues
- shared operational data

## 2. Create

Creation wizard should collect required core information before final Create.

Minimum confirmed:
- name
- company
- customer
- at least one material
- quantity for each material

Implementation defaults may include shipment/destination/commercial terms as additional required fields once validated in the detailed form design.

## 3. Convert Task to Project

Action:
`Convert to Project`

Behavior:
1. permission check
2. confirmation
3. change same work-item type to `project`
4. preserve same ID internally
5. preserve customer/materials/shared data/documents/files/notes/issues
6. audit conversion

Do not create a second work item.

## 4. Statuses

Exactly:
- In Progress
- Cancelled
- Completed
- Archived

No `New` or `Paused` in current confirmed scope.

## 5. Filtering

Status filter:
- dropdown
- checklist
- multiple selected values
- clear all
- select all where useful

## 6. Pin

Project supports pin/unpin.

Pinned items are visually prioritized.

## 7. Archive

Archive is a status transition and consequential action.

Archived section:
- bottom of Project list
- collapsed by default
- expandable

Reopen:
- Admin
- User only if permission granted

## 8. Shared data categories

Likely shared:
- customer identity
- destination
- materials
- quantities
- prices
- currencies
- units
- packing
- origin
- Incoterm
- payment terms
- shipping references
- container/shipment details where common

The detailed document spec defines exact mappings.

## 9. Shared data conflict algorithm

On document save:
1. Compare document shared fields to work-item shared fields.
2. If no conflict, save normally.
3. If a field introduces missing shared data, offer/save into shared layer according to form flow.
4. If conflict:
   - show field
   - current project value
   - proposed document value
5. Ask: Update Project Data?
6. If No:
   - save document-specific value only
   - clearly indicate it differs from Project Data
7. If Yes:
   - update project shared value
   - compute affected documents
   - show second confirmation with checklist
8. User selects documents
9. Update selected documents in place
10. Audit every changed value

No silent all-document update.

## 10. Price behavior

When material selected:
- read latest selling price for that company/material
- suggest price
- label as suggested/latest
- user can edit
- when operation is saved with a selling price, update latest price record

## 11. Notes

Simple project/work commentary.

Viewer can create.

## 12. Report Issues

Fields:
- description
- severity
- status
- reporter
- timestamps

Viewer can create.

Status changes require permission.

## 13. Data completeness

UI should show validation clearly before project creation.

Do not create meaningless empty Projects as normal flow.
