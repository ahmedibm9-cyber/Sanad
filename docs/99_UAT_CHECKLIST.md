# SANAD — Master Real-User Acceptance Test Checklist

> Pre-delivery baseline. Every item = a real user action or observable result.
> Any feature missing from this list = a Gap.

---

## 1. Login / Account / Session

- [ ] Login with correct credentials.
- [ ] Wrong password shows clear error message.
- [ ] Non-existent user shows clear error.
- [ ] Disabled user cannot login.
- [ ] Logout works.
- [ ] Refresh after login keeps session alive.
- [ ] Close tab and reopen — session behavior per policy.
- [ ] Open app in two tabs simultaneously.
- [ ] Change password (if supported).
- [ ] Current user name visible clearly.
- [ ] Current user role in active company visible.
- [ ] User cannot see pages they lack permission for.
- [ ] Admin revokes permission while user is active — permission stops without insecure re-login.
- [ ] Admin disables user — user cannot continue working on disabled account.

---

## 2. Company / Workspace Switching

- [ ] Admin creates new company.
- [ ] Edit existing company.
- [ ] Switch active company.
- [ ] Dashboard data changes on switch.
- [ ] Projects change per company.
- [ ] Customers change per company.
- [ ] Materials change per company.
- [ ] Documents change per company.
- [ ] Settings change per company.
- [ ] No data from previous company visible after switch.
- [ ] Refresh after switch keeps correct company.
- [ ] User with access to 2 companies cannot see the 3rd.
- [ ] Same customer name can exist in two companies as independent records.
- [ ] Same material can exist in two companies without auto-sharing.
- [ ] Factory Code is shared across companies.

---

## 3. Dashboard

- [ ] Dashboard opens without errors.
- [ ] In Progress Projects count correct.
- [ ] In Progress Tasks count correct.
- [ ] Overdue Tasks count correct.
- [ ] Open/Critical Issues count correct.
- [ ] Personal To-dos show for current user only.
- [ ] Recent Activity is real data.
- [ ] Recent Documents is real data.
- [ ] Widgets link to correct pages.
- [ ] Clicking Project widget opens Projects.
- [ ] Clicking Issue widget opens correct Issue/Project.
- [ ] Empty dashboard state when no data.
- [ ] Loading state visible.
- [ ] No dummy/stress data.
- [ ] Dashboard changes on company switch.
- [ ] Dashboard Arabic RTL correct.
- [ ] Dashboard on 1366×768 usable.

---

## 4. Global Search

- [ ] Open search with mouse.
- [ ] Open with keyboard shortcut (if available).
- [ ] Search by customer name.
- [ ] Search by phone number.
- [ ] Search by material name.
- [ ] Search by grade (e.g. `952`).
- [ ] Search by HS code.
- [ ] Search by project name.
- [ ] Search by task name.
- [ ] Search by document number.
- [ ] Search in factory codes.
- [ ] Results grouped by category.
- [ ] Each result clickable.
- [ ] Arrow Up/Down navigates results.
- [ ] Enter opens selected result.
- [ ] Escape closes search.
- [ ] No results state.
- [ ] Loading state.
- [ ] Search is fast on typing.
- [ ] Rapid `9` → `95` → `952` doesn't show stale results.
- [ ] User doesn't see results from unauthorized companies.
- [ ] Factory Code remains global.

---

## 5. Users Management

- [ ] Open Users page.
- [ ] Add User.
- [ ] Enter name.
- [ ] Enter username/email.
- [ ] Create account securely.
- [ ] Assign company access.
- [ ] Choose different role per company.
- [ ] Save.
- [ ] New user appears in list.
- [ ] Edit User.
- [ ] Disable User.
- [ ] Re-enable User (if supported).
- [ ] Search for User.
- [ ] Status displayed clearly.
- [ ] Role displayed clearly.
- [ ] Long names don't break layout.
- [ ] Admin menu displays users readably.

---

## 6. Permissions

- [ ] Admin opens Permissions configuration.
- [ ] Select specific company for user.
- [ ] Viewer in Company A.
- [ ] User in Company B.
- [ ] No Access in Company C.
- [ ] Project View permission.
- [ ] Project Create.
- [ ] Project Edit.
- [ ] Project Archive.
- [ ] Project Reopen.
- [ ] Project Trash.
- [ ] Task permissions.
- [ ] Document View.
- [ ] Document Create.
- [ ] Document Edit.
- [ ] Document Preview.
- [ ] Document Print.
- [ ] Document Download.
- [ ] Customer permissions.
- [ ] Material permissions.
- [ ] File upload.
- [ ] File download.
- [ ] Reports view/export.
- [ ] Factory Code view/export/import.
- [ ] Audit view.
- [ ] Trash view/restore.
- [ ] Settings edit.
- [ ] Users management.
- [ ] Permission management.
- [ ] Backup create.
- [ ] Backup restore.
- [ ] Critical permissions visually distinct.
- [ ] Save permissions.
- [ ] Logout/Login or Refresh — new permissions actually applied.

---

## 7. Viewer Role

- [ ] Viewer opens Project.
- [ ] Viewer sees data.
- [ ] Viewer searches.
- [ ] Viewer adds Note.
- [ ] Viewer reports Issue.
- [ ] Viewer downloads (only if permitted).
- [ ] Viewer cannot edit Project.
- [ ] Viewer cannot edit Customer.
- [ ] Viewer cannot edit Material.
- [ ] Viewer cannot edit Document.
- [ ] Viewer cannot change Settings.
- [ ] Viewer cannot Archive/Reopen unless explicit permission.
- [ ] Permission Denied message is clear, not blank screen.

---

## 8. Company Identity Settings

- [ ] Arabic Name.
- [ ] English Name.
- [ ] Arabic Legal Name.
- [ ] English Legal Name.
- [ ] Short Name.
- [ ] Company Code.
- [ ] Country.
- [ ] City.
- [ ] Address Arabic.
- [ ] Address English.
- [ ] Postal Code.
- [ ] Phone.
- [ ] Secondary Phone.
- [ ] Email.
- [ ] Website.
- [ ] CR Number.
- [ ] VAT Number.
- [ ] Tax Registration data.
- [ ] Save.
- [ ] Navigate away.
- [ ] Return.
- [ ] Hard Refresh.
- [ ] Logout/Login.
- [ ] All data persists.

---

## 9. Logo / Stamp / Signature

- [ ] Upload Logo.
- [ ] Preview Logo.
- [ ] Save.
- [ ] Navigate away/back.
- [ ] Refresh.
- [ ] Logo persists.
- [ ] Replace Logo.
- [ ] Upload Stamp.
- [ ] Stamp transparent PNG displays correctly.
- [ ] Refresh persistence.
- [ ] Upload Signature.
- [ ] Refresh persistence.
- [ ] Delete/replace asset (if allowed).
- [ ] Logo appears in Document Preview.
- [ ] Stamp appears in Document Preview.
- [ ] Signature appears in Document Preview.
- [ ] Natural sizes.
- [ ] Aspect ratio preserved.

---

## 10. Bank Accounts

- [ ] Add Bank Account.
- [ ] Bank Name.
- [ ] Account Name.
- [ ] Account Number.
- [ ] IBAN.
- [ ] SWIFT/BIC.
- [ ] Bank Address.
- [ ] Currency.
- [ ] Set Default.
- [ ] Edit Bank Account.
- [ ] Disable/Remove per system rules.
- [ ] Multiple Bank Accounts.
- [ ] Select Bank Account in Document.
- [ ] Data appears correctly in PDF.

---

## 11. Configurable Lists

Test Add/Edit/Disable/Default for each:

- [ ] Currencies.
- [ ] VAT Rates.
- [ ] Weight Units.
- [ ] Packing Units.
- [ ] Incoterms.
- [ ] Payment Terms.
- [ ] Delivery Terms.
- [ ] Any linked Document Defaults.
- [ ] New value appears in Dropdowns without refresh (if designed).
- [ ] Persists after refresh.
- [ ] Disabled values don't appear in new Create flows.
- [ ] Old values in historical Documents don't break.

---

## 12. Application Language vs Document Language

- [ ] UI = English → Document default = English.
- [ ] UI = Arabic → Document default stays English.
- [ ] All menus Arabic RTL.
- [ ] Create Invoice opens English LTR.
- [ ] Change one Document to Arabic.
- [ ] SANAD UI stays Arabic.
- [ ] Change UI to English doesn't change saved Document language.
- [ ] User language preference saved after refresh/login.
- [ ] Company Document Language default saved independently.

---

## 13. Customers List

- [ ] Open Customers.
- [ ] Data loads.
- [ ] Search by name.
- [ ] Search by phone.
- [ ] Filter (if available).
- [ ] Sort.
- [ ] Pagination.
- [ ] Open Customer.
- [ ] Edit Customer.
- [ ] Move to Trash.
- [ ] Restore.

---

## 14. Add Customer

Test all fields:

- [ ] Display Name.
- [ ] Legal Name.
- [ ] Arabic Name.
- [ ] English Name.
- [ ] Contact Person.
- [ ] Phone.
- [ ] Secondary Phone.
- [ ] Email.
- [ ] Website.
- [ ] Country.
- [ ] City.
- [ ] Address.
- [ ] Postal Code.
- [ ] VAT/Tax Number.
- [ ] Registration Number.
- [ ] Commercial Defaults.
- [ ] Logistics Defaults.
- [ ] Notes.
- [ ] Save.
- [ ] Customer appears in list.
- [ ] Refresh.
- [ ] Customer persists.

---

## 15. Customer Contacts

If interface supports multiple contacts:

- [ ] Add Contact.
- [ ] Name.
- [ ] Job Title.
- [ ] Email.
- [ ] Phone.
- [ ] Primary Contact.
- [ ] Edit.
- [ ] Remove.
- [ ] Correct contact appears in Project/Document.

---

## 16. Customer Commercial Defaults

- [ ] Currency.
- [ ] VAT.
- [ ] Payment Terms.
- [ ] Payment Notes.
- [ ] Incoterm.
- [ ] Delivery Terms.
- [ ] Preferred Document Language.
- [ ] Preferred Template.
- [ ] Commercial Notes.
- [ ] Create new Project, select Customer.
- [ ] All values pre-fill as suggestions.
- [ ] Changing Project value doesn't auto-change Customer master.
- [ ] `Update Customer Default` works only with confirmation.

---

## 17. Customer Logistics Defaults

- [ ] Destination Country.
- [ ] Destination City.
- [ ] Port/Delivery Location.
- [ ] Transport Responsibility.
- [ ] Loading Responsibility.
- [ ] Unloading Responsibility.
- [ ] Default Consignee.
- [ ] Default Notify Party.
- [ ] Preferred Packing.
- [ ] Shipping Notes.
- [ ] Special Handling.
- [ ] All pre-fill when customer selected in Project.

---

## 18. Inline Add New Customer

- [ ] Open Create Project.
- [ ] Open Customer selector.
- [ ] First option: `+ Add New Customer`.
- [ ] Open it.
- [ ] Create Customer.
- [ ] Return to Project form.
- [ ] Previously entered Project data not lost.
- [ ] New Customer auto-selected.
- [ ] Save Project.
- [ ] Refresh.
- [ ] Relationship correct.

---

## 19. Materials List

- [ ] Open Materials.
- [ ] Search.
- [ ] Filter.
- [ ] Sort.
- [ ] Pagination.
- [ ] Add Material.
- [ ] Edit.
- [ ] View detail.
- [ ] Trash.
- [ ] Restore.

---

## 20. Add/Edit Material

- [ ] Material Name.
- [ ] Grade.
- [ ] Material Code (if available).
- [ ] Manufacturer.
- [ ] Origin.
- [ ] HS Code.
- [ ] Default Packing.
- [ ] Default Weight Unit.
- [ ] Latest Selling Price.
- [ ] Currency.
- [ ] Save.
- [ ] Refresh persistence.

---

## 21. Material Files

For each file type:

- [ ] Upload TDS.
- [ ] View.
- [ ] Download.
- [ ] Replace.
- [ ] Upload MSDS.
- [ ] View/Download.
- [ ] Upload COA.
- [ ] View/Download.
- [ ] Other file (if available).
- [ ] Material used in multiple Projects without re-uploading.
- [ ] Refresh — attachments persist.

---

## 22. Last Selling Price

Specific test:

- [ ] Material price first time = 1000.
- [ ] Save Project.
- [ ] New Project same Material.
- [ ] Suggested price = 1000.
- [ ] Change to 1040.
- [ ] Save.
- [ ] Third Project.
- [ ] Suggested price = 1040.
- [ ] First Project still shows 1000.

---

## 23. Inline Add New Material

- [ ] Inside Project Material selector.
- [ ] First option: `+ Add New Material`.
- [ ] Create Material.
- [ ] Return to same Project form.
- [ ] Rest of form data preserved.
- [ ] New Material auto-selected.

---

## 24. Projects List

- [ ] Open Projects.
- [ ] Create Project.
- [ ] Search.
- [ ] Customer filter.
- [ ] Date filters.
- [ ] Multi-status filter.
- [ ] Select In Progress + Completed together.
- [ ] Pin.
- [ ] Unpin.
- [ ] Three-dot menu.
- [ ] Menu not hidden.
- [ ] Edit.
- [ ] Archive.
- [ ] Reopen.
- [ ] Trash.
- [ ] Pagination.
- [ ] Archived section expand/collapse.

---

## 25. Project Create

- [ ] Project Name.
- [ ] Correct Company.
- [ ] Customer.
- [ ] Multiple Materials.
- [ ] Quantity.
- [ ] Unit.
- [ ] Price.
- [ ] Currency.
- [ ] Packing.
- [ ] Destination.
- [ ] Incoterm.
- [ ] Payment Terms.
- [ ] Delivery Terms.
- [ ] Shipping info.
- [ ] Notes/Description per design.
- [ ] Save.
- [ ] Appears in Projects.
- [ ] Refresh.
- [ ] Persists.

---

## 26. Project Edit Hydration

- [ ] Open saved Project.
- [ ] Edit.
- [ ] Current Customer selected.
- [ ] All Materials present.
- [ ] Quantities correct.
- [ ] Prices correct.
- [ ] Currency correct.
- [ ] Packing correct.
- [ ] Destination.
- [ ] Incoterm.
- [ ] Payment terms.
- [ ] Shipping.
- [ ] No `Select Customer` shown instead of current customer.
- [ ] Save edits.
- [ ] Refresh.
- [ ] Edits persist.

---

## 27. Project Status

Test each Status:

- [ ] In Progress.
- [ ] Cancelled.
- [ ] Completed.
- [ ] Archived.
- [ ] Filter by each.
- [ ] Multi-select filters.
- [ ] Archived Projects at end of list.
- [ ] Authorized Admin/User can Reopen.
- [ ] Viewer cannot unless explicit permission.

---

## 28. Project Detail

Test each Tab:

- [ ] Overview.
- [ ] Project Data.
- [ ] Materials.
- [ ] Documents.
- [ ] Attachments.
- [ ] Notes & Issues.
- [ ] Activity.
- [ ] Switching tabs doesn't lose data.
- [ ] Refresh while inside Project.
- [ ] Back returns to correct location.

---

## 29. Project Materials

- [ ] Add Material.
- [ ] Edit line.
- [ ] Quantity.
- [ ] Unit.
- [ ] Packing.
- [ ] Price.
- [ ] Currency.
- [ ] Remove material.
- [ ] Multiple rows.
- [ ] Totals (if available).
- [ ] Save.
- [ ] Refresh persistence.

---

## 30. Shipment Details

Test per existing fields:

- [ ] Shipping Method.
- [ ] Place of Receipt.
- [ ] Port of Loading.
- [ ] Port of Discharge.
- [ ] Place of Delivery.
- [ ] Vessel.
- [ ] Voyage.
- [ ] Container Number.
- [ ] Seal Number.
- [ ] Freight Terms.
- [ ] Marks & Numbers.
- [ ] Packages.
- [ ] Net Weight.
- [ ] Gross Weight.
- [ ] CBM.
- [ ] Planned date (if available).
- [ ] Save/Reload.

---

## 31. Tasks List

- [ ] Open Tasks.
- [ ] Create Task.
- [ ] Search.
- [ ] Filter.
- [ ] Edit.
- [ ] Archive.
- [ ] Trash.
- [ ] Documents.
- [ ] Materials.
- [ ] Notes.
- [ ] Issues.
- [ ] Attachments.
- [ ] Status.
- [ ] Persistence.

---

## 32. Task Create Input Stability

- [ ] Type Task Name.
- [ ] Move to another field.
- [ ] Name doesn't disappear.
- [ ] Add Customer.
- [ ] Data doesn't reset.
- [ ] Add Material.
- [ ] Data doesn't reset.
- [ ] Save.
- [ ] Task appears.
- [ ] Refresh persistence.

---

## 33. Convert Task → Project

Create Task with:

- [ ] Customer.
- [ ] 2 Materials.
- [ ] Attachment.
- [ ] Note.
- [ ] Issue.
- [ ] Document.

Then:

- [ ] Convert to Project.
- [ ] Same data.
- [ ] No duplicate Task.
- [ ] All Documents present.
- [ ] All Attachments present.
- [ ] Notes present.
- [ ] Issues present.
- [ ] Project appears in Projects.

---

## 34. Personal To-dos

- [ ] Create To-do.
- [ ] Title.
- [ ] Description.
- [ ] Due Date.
- [ ] Due Time.
- [ ] Priority.
- [ ] Save.
- [ ] Edit.
- [ ] Mark Done.
- [ ] Mark Not Done.
- [ ] Filters.
- [ ] Voice Input.
- [ ] Refresh persistence.
- [ ] User A doesn't see User B To-dos.
- [ ] Admin Dashboard shows own To-dos by default.

---

## 35. Notes

- [ ] Add Note.
- [ ] Write Text.
- [ ] Voice Input.
- [ ] Start mic.
- [ ] Stop mic.
- [ ] Speech enters field.
- [ ] Save.
- [ ] Note appears.
- [ ] Navigate away.
- [ ] Return.
- [ ] Hard refresh.
- [ ] Note persists.
- [ ] Author correct.
- [ ] Timestamp correct.
- [ ] Viewer can add Note.
- [ ] Edit Note per permission (if supported).

---

## 36. Voice Input General

In every supported location:

- [ ] Mic visible.
- [ ] Permission request.
- [ ] Listening state.
- [ ] Stop.
- [ ] Transcript.
- [ ] Empty field starts new.
- [ ] Selected text replaced per behavior.
- [ ] Deleted old speech doesn't return.
- [ ] Permission denied handling.
- [ ] Browser unsupported handling.
- [ ] Recognition error handling.
- [ ] Doesn't stay Listening forever.

---

## 37. Report Issues

- [ ] Create.
- [ ] Description.
- [ ] Severity: Low.
- [ ] Medium.
- [ ] High.
- [ ] Critical.
- [ ] Status: Open.
- [ ] Under Review.
- [ ] Resolved.
- [ ] Rejected.
- [ ] Save.
- [ ] Navigate away/back.
- [ ] Refresh.
- [ ] Issue persists.
- [ ] Viewer can create Issue.
- [ ] Authorized User can change Status.
- [ ] Authorized User can change Severity.

---

## 38. Attachments

- [ ] Upload.
- [ ] Click file selector.
- [ ] Drag/drop.
- [ ] Show selected filename.
- [ ] Category.
- [ ] Description.
- [ ] Remove selected before Upload.
- [ ] Replace selected.
- [ ] Upload.
- [ ] Progress.
- [ ] Attachment appears.
- [ ] Navigate away/back.
- [ ] Refresh.
- [ ] View.
- [ ] Download.
- [ ] Trash.
- [ ] Restore.
- [ ] Invalid type rejection.
- [ ] Oversized file rejection.
- [ ] Zero-byte file handling.
- [ ] Duplicate filename handling.

---

## 39. Document Creation Entry Points

From Task and Project:

- [ ] New Document.
- [ ] Invoice dropdown.
- [ ] QUOT.
- [ ] PINV.
- [ ] TINV.
- [ ] CINV.
- [ ] PKL.
- [ ] DN.
- [ ] BL.
- [ ] Each option opens real form.
- [ ] No dead buttons.

---

## 40. General Document Form

- [ ] Document Type.
- [ ] Manual Document Number.
- [ ] Date.
- [ ] Expiration Date per type.
- [ ] Language.
- [ ] Template.
- [ ] Customer.
- [ ] Materials.
- [ ] Quantity.
- [ ] Unit.
- [ ] Price.
- [ ] Currency.
- [ ] Terms.
- [ ] Prepared By.
- [ ] Bank Account.
- [ ] Stamp toggle.
- [ ] Signature toggle.
- [ ] Logo toggle (if available).
- [ ] Save.
- [ ] Validation.
- [ ] Cancel.
- [ ] Unsaved changes warning.

---

## 41. Quotation

- [ ] Number.
- [ ] Date.
- [ ] Expiration/Validity.
- [ ] Buyer.
- [ ] Contact.
- [ ] Material lines.
- [ ] Quantity.
- [ ] Price.
- [ ] Currency.
- [ ] Payment Terms.
- [ ] Delivery Terms.
- [ ] Shipping.
- [ ] Commercial Notes.
- [ ] Bank.
- [ ] Totals.
- [ ] Preview.
- [ ] Print.
- [ ] PDF.
- [ ] Edit/reload.

---

## 42. PINV

- [ ] Number.
- [ ] Date.
- [ ] Customer.
- [ ] Materials.
- [ ] Price.
- [ ] Terms.
- [ ] Bank.
- [ ] Preview.
- [ ] PDF.
- [ ] Arabic/English.
- [ ] Persistence.

---

## 43. TINV

- [ ] Manual Number.
- [ ] VAT 0%.
- [ ] VAT 15%.
- [ ] Calculation.
- [ ] VAT amount.
- [ ] Total.
- [ ] QR absent at 0%.
- [ ] QR present at 15% per rule.
- [ ] Preview.
- [ ] PDF.
- [ ] Edit.
- [ ] Reload.

---

## 44. CINV

- [ ] All core data.
- [ ] Title: Commercial Invoice.
- [ ] Terms.
- [ ] Bank.
- [ ] Material lines.
- [ ] Preview.
- [ ] PDF.
- [ ] Print.
- [ ] Persistence.

---

## 45. Packing List

- [ ] Invoice Reference.
- [ ] Consignee.
- [ ] Marks.
- [ ] Item Code.
- [ ] Description.
- [ ] Packages.
- [ ] Quantity.
- [ ] Net Weight.
- [ ] Gross Weight.
- [ ] Container.
- [ ] Seal.
- [ ] CBM.
- [ ] Prepared By.
- [ ] Preview.
- [ ] PDF.
- [ ] Multiple materials.

---

## 46. Delivery Note

- [ ] DN Number.
- [ ] Date.
- [ ] Customer/Importer.
- [ ] Shipping Method.
- [ ] Destination.
- [ ] Prepare Before.
- [ ] Invoice Reference.
- [ ] Materials.
- [ ] Unit.
- [ ] Quantity.
- [ ] Origin.
- [ ] Remarks.
- [ ] Approved By.
- [ ] Received By.
- [ ] Preview.
- [ ] PDF.
- [ ] No blank second page for short documents.

---

## 47. Bill of Lading

- [ ] Shipper.
- [ ] Consignee.
- [ ] Notify Party.
- [ ] Place of Receipt.
- [ ] Port of Loading.
- [ ] Port of Discharge.
- [ ] Place of Delivery.
- [ ] Vessel.
- [ ] Voyage.
- [ ] Container.
- [ ] Seal.
- [ ] Marks.
- [ ] Goods Description.
- [ ] Packages.
- [ ] Gross Weight.
- [ ] Net Weight.
- [ ] Freight Terms.
- [ ] Remarks.
- [ ] Preview.
- [ ] PDF.

---

## 48. Document Number Validation

- [ ] Company A → `CINV-100` succeeds.
- [ ] Company A → `CINV-100` again rejected.
- [ ] Company B → `CINV-100` succeeds.
- [ ] Edit same Document with same number succeeds.
- [ ] Duplicate error is clear.
- [ ] Double-click Create doesn't create duplicate.

---

## 49. Documents List

For each row:

- [ ] Number clear.
- [ ] Type clear.
- [ ] Date.
- [ ] Status.
- [ ] Prepared By.
- [ ] Preview.
- [ ] Edit.
- [ ] Print.
- [ ] Download PDF.
- [ ] More menu.
- [ ] Trash.
- [ ] No blank Number/Type records appearing valid.

---

## 50. Document Preview

- [ ] Preview opens.
- [ ] A4 visible.
- [ ] Correct Company.
- [ ] Correct Customer.
- [ ] Correct Materials.
- [ ] Language switch.
- [ ] Template switch.
- [ ] Zoom.
- [ ] Print.
- [ ] PDF.
- [ ] Back.
- [ ] No sample/fake data.

---

## 51. Shared Project Data

Core test:

Project: `50 MT`
Document: `48 MT`

- [ ] Conflict appears.
- [ ] Current Project Value shown.
- [ ] New Document Value shown.
- [ ] Keep Document Value Only.
- [ ] Project stays 50.
- [ ] Document becomes 48.
- [ ] Update Project Data.
- [ ] Affected Documents checklist.
- [ ] Select Documents.
- [ ] Update Selected.
- [ ] Same Document IDs.
- [ ] Same Document Numbers.
- [ ] No duplicate visible versions.
- [ ] Cancel works.
- [ ] Audit records before/after.

---

## 52. Templates — Existing + 7 PDF-derived

Test each Template separately:

- [ ] Fulla Packing List.
- [ ] Fulla Quotation.
- [ ] Fulla Tax Invoice Layout A.
- [ ] Fulla Delivery Note.
- [ ] Fulla Commercial Invoice.
- [ ] Fulla Tax Invoice Layout B.
- [ ] Fulla Proforma Invoice.
- [ ] Any original Template A/B if still present.

For each:

- [ ] Selectable.
- [ ] Preview.
- [ ] English.
- [ ] Arabic.
- [ ] Logo.
- [ ] Stamp.
- [ ] Signature.
- [ ] 1 material.
- [ ] Multiple materials.
- [ ] Long name.
- [ ] Multi-page.
- [ ] PDF.
- [ ] Print.

---

## 53. PDF Quality

Actually open the files:

- [ ] Text selectable.
- [ ] Text searchable.
- [ ] Not a screenshot.
- [ ] Not blurry.
- [ ] A4.
- [ ] Arabic connected correctly.
- [ ] RTL correct.
- [ ] Long tables paginate.
- [ ] Headers repeat.
- [ ] No clipping.
- [ ] Stamp natural.
- [ ] Signature natural.
- [ ] No unwanted blank pages.

---

## 54. Factory Code — View/Search

- [ ] Factory Code page opens.
- [ ] Records count.
- [ ] Search factory name.
- [ ] Search code.
- [ ] Search product.
- [ ] Search `952`.
- [ ] Search HS Code.
- [ ] Search city.
- [ ] Filters.
- [ ] Pagination.
- [ ] Clear filters.
- [ ] Search remains usable with thousands of records.

---

## 55. Factory Code — Initial Import

- [ ] Admin Upload.
- [ ] Select Excel.
- [ ] Filename visible.
- [ ] Parse.
- [ ] Validate.
- [ ] Invalid rows shown.
- [ ] Preview.
- [ ] Apply Smart Update.
- [ ] Real counts.
- [ ] Done.
- [ ] Table refreshes.
- [ ] Search known imported record.
- [ ] Hard Refresh.
- [ ] Record remains.

---

## 56. Factory Code — Smart Update

Upload Version 2:

- [ ] New records added.
- [ ] Changed records updated.
- [ ] Unchanged retained.
- [ ] Missing-from-new-file old records retained.
- [ ] Summary counts accurate.
- [ ] No historical deletion.
- [ ] Import history saved.

---

## 57. Factory Code Export

- [ ] Export Filtered Excel.
- [ ] Export Full Database.
- [ ] Open Excel.
- [ ] Headers correct.
- [ ] Arabic intact.
- [ ] Codes don't convert to scientific notation.
- [ ] Row count correct.
- [ ] Filtered source matches screen.

---

## 58. Reports

Test each report:

- [ ] Projects by Status.
- [ ] Projects by Date.
- [ ] Projects by Company.
- [ ] Projects by Customer.
- [ ] Documents Register.
- [ ] Tasks.
- [ ] Overdue Tasks.
- [ ] User Activity.
- [ ] Customer Export History.
- [ ] Material Export History.
- [ ] Audit Report.

For each:

- [ ] Filters.
- [ ] Date range.
- [ ] Company.
- [ ] Customer (if applicable).
- [ ] Status.
- [ ] Preview/table.
- [ ] PDF.
- [ ] Excel.
- [ ] Export data = filtered screen data.

---

## 59. Audit Log

- [ ] Create event.
- [ ] View event where required.
- [ ] Edit event.
- [ ] Trash.
- [ ] Restore.
- [ ] Download.
- [ ] PDF.
- [ ] Export.
- [ ] Archive.
- [ ] Reopen.
- [ ] Permission Change.
- [ ] Settings Change.
- [ ] Factory Import.
- [ ] Backup.
- [ ] Restore Backup.
- [ ] Task → Project.
- [ ] Search by User.
- [ ] User ID.
- [ ] Document Number.
- [ ] Entity.
- [ ] Company.
- [ ] Date.
- [ ] Before/After view.
- [ ] Open related record.

---

## 60. Trash

- [ ] Trash Project.
- [ ] Restore.
- [ ] Trash Task.
- [ ] Restore.
- [ ] Trash Document.
- [ ] Restore.
- [ ] Trash Customer.
- [ ] Restore.
- [ ] Trash Material.
- [ ] Restore.
- [ ] Trash Attachment.
- [ ] Restore.
- [ ] Search Trash.
- [ ] Filter entity type.
- [ ] Deleted By.
- [ ] Deleted Date.
- [ ] Restore confirmation.
- [ ] Collision handling if Document Number taken while old in Trash.

---

## 61. Notifications

- [ ] Bell opens panel.
- [ ] Unread count.
- [ ] Mark Read.
- [ ] Mark All Read.
- [ ] Click notification opens related record.
- [ ] Task assigned.
- [ ] Due Soon.
- [ ] Overdue.
- [ ] Report Issue.
- [ ] Critical Issue.
- [ ] Document changed.
- [ ] Attachment uploaded.
- [ ] Permissions changed.
- [ ] Project Archived.
- [ ] Project Reopened.
- [ ] Factory Code updated.
- [ ] Backup Success.
- [ ] Backup Failure.
- [ ] To-do Reminder.
- [ ] Preferences can disable selected categories.
- [ ] No duplicate notification spam.

---

## 62. Backup

- [ ] Manual Online Backup.
- [ ] Manual Offline Backup.
- [ ] Automatic Backup setting.
- [ ] Schedule configuration.
- [ ] Last Backup status.
- [ ] Backup Success notification.
- [ ] Backup Failure notification.
- [ ] Download offline artifact.
- [ ] Backup includes DB data.
- [ ] Backup includes files/assets.

---

## 63. Restore

- [ ] Choose Backup.
- [ ] Validate.
- [ ] Preview metadata.
- [ ] Confirm.
- [ ] Restore.
- [ ] Integrity check.
- [ ] Login.
- [ ] Companies returned.
- [ ] Customers.
- [ ] Materials.
- [ ] Projects.
- [ ] Documents.
- [ ] Attachments.
- [ ] TDS/MSDS/COA.
- [ ] Logo/Stamp/Signature.
- [ ] Settings.
- [ ] Audit.
- [ ] PDFs can regenerate.

---

## 64. Licensing UI

- [ ] License Status.
- [ ] Valid Until.
- [ ] Last Verification.
- [ ] Refresh/Verify.
- [ ] Valid state.
- [ ] Expiring state.
- [ ] Expired state.
- [ ] Server unavailable.
- [ ] Grace behavior.
- [ ] Customer data unaffected.
- [ ] No business data sent to license server.

---

## 65. Forms — General UX

For each major Form:

- [ ] Required fields clear.
- [ ] Invalid input error.
- [ ] Save loading.
- [ ] Double-click prevented.
- [ ] Save Success only when truly saved.
- [ ] Save Failure preserves data.
- [ ] Cancel.
- [ ] Unsaved Changes warning.
- [ ] Tab navigation.
- [ ] Modal scroll.
- [ ] Footer buttons reachable.
- [ ] 1366×768 usable.

---

## 66. Dropdowns / Menus

- [ ] Every Dropdown opens.
- [ ] Not hidden behind table/card.
- [ ] Top row visible.
- [ ] Bottom row visible.
- [ ] Near edge behavior.
- [ ] RTL.
- [ ] LTR.
- [ ] Keyboard navigation.
- [ ] Search inside dropdown if list is large.
- [ ] Add New entity as first option in Customer/Material selectors.

---

## 67. Inline Create Pattern

Test any entity selector that supports creation:

- [ ] `+ Add New Customer`.
- [ ] `+ Add New Material`.
- [ ] Any other approved entity.
- [ ] Parent form doesn't reset.
- [ ] New entity auto-selected.
- [ ] Keyboard accessible.
- [ ] Arabic/English.

---

## 68. Persistence Master Test

For each Entity:

Create → Navigate away → Return → Hard Refresh → Logout/Login.

Test for:

- [ ] Company Settings.
- [ ] Company Assets.
- [ ] Customer.
- [ ] Material.
- [ ] Project.
- [ ] Task.
- [ ] To-do.
- [ ] Document.
- [ ] Note.
- [ ] Issue.
- [ ] Attachment.
- [ ] Factory Code import.
- [ ] User permissions.

Any disappearance = **Critical Fail**.

---

## 69. Loading / Empty / Error States

For each Main module:

- [ ] Loading.
- [ ] Empty.
- [ ] No search results.
- [ ] Error.
- [ ] Permission denied.
- [ ] Retry.
- [ ] Clear filters where appropriate.
- [ ] No blank white screen.

---

## 70. Accessibility — Real User Checks

- [ ] Keyboard-only usage.
- [ ] Tab order logical.
- [ ] Focus visible.
- [ ] Modals trap focus.
- [ ] Escape closes correct dialogs.
- [ ] Focus returns to trigger button after Modal.
- [ ] Icon buttons have Tooltips.
- [ ] Icon buttons have accessible labels.
- [ ] Form labels clear.
- [ ] Errors not color-dependent only.
- [ ] Tables readable.
- [ ] 200% Zoom.
- [ ] Reduced motion.
- [ ] Contrast sufficient.
- [ ] No keyboard traps.

---

## 71. Arabic RTL

Test in Arabic:

- [ ] Login.
- [ ] Dashboard.
- [ ] Projects.
- [ ] Project Detail.
- [ ] Tasks.
- [ ] To-dos.
- [ ] Customers.
- [ ] Materials.
- [ ] Factory Code.
- [ ] Documents.
- [ ] Preview.
- [ ] Reports.
- [ ] Audit.
- [ ] Trash.
- [ ] Notifications.
- [ ] Users.
- [ ] Permissions.
- [ ] Settings.
- [ ] Dropdown positioning.
- [ ] Back arrows.
- [ ] Tables.
- [ ] Long Arabic text.
- [ ] Arabic + English + numbers in same row.

---

## 72. Screen Sizes

Test on:

- [ ] 1920×1080.
- [ ] 1440×900.
- [ ] 1366×768 — most important.
- [ ] 1024×768.
- [ ] Tablet.
- [ ] 430px.
- [ ] 375px.

Focus on:

- [ ] Sidebar.
- [ ] Topbar.
- [ ] Tables.
- [ ] Forms.
- [ ] Modals.
- [ ] Document preview.
- [ ] Settings.
- [ ] Permissions.

---

## 73. Browser Tests

At minimum:

- [ ] Chrome.
- [ ] Edge.
- [ ] Firefox.
- [ ] Safari (if environment allows).

Focus on:

- [ ] Print.
- [ ] PDF.
- [ ] Voice Input.
- [ ] File Upload.
- [ ] Date fields.

---

## 74. Network Failure Tests

As user:

- [ ] Disconnect internet during Save Customer.
- [ ] During Save Project.
- [ ] During Save Document.
- [ ] During Upload.
- [ ] During Shared Data sync.
- [ ] During Backup.
- [ ] During Factory Import.

Expected:

- [ ] No false success.
- [ ] Form data not lost.
- [ ] Clear retry.
- [ ] No duplicate on retry.
- [ ] No half-saved data visible.

---

## 75. Double Click / Repeated Actions

- [ ] Double-click Save Customer.
- [ ] Save Project.
- [ ] Create Document.
- [ ] Upload.
- [ ] Factory Update.
- [ ] Backup.

Expected: single operation only.

---

## 76. Long / Weird Data

Try:

- [ ] Very long company name.
- [ ] Long customer name.
- [ ] Long address.
- [ ] Long Arabic text.
- [ ] Long material name.
- [ ] Long notes.
- [ ] Long payment terms.
- [ ] Special characters.
- [ ] Arabic + English mix.
- [ ] Leading zeros.
- [ ] Large numeric values.
- [ ] Decimal quantities.

Ensure UI/PDF/Excel don't break.

---

## 77. Final "Workday" Test

The most important end-to-end test:

- [ ] Login.
- [ ] Switch Company.
- [ ] Create Customer.
- [ ] Create Material.
- [ ] Upload TDS.
- [ ] Create Project.
- [ ] Add 3 Materials.
- [ ] Save.
- [ ] Add Note with voice.
- [ ] Report Issue.
- [ ] Upload Attachment.
- [ ] Create QUOT.
- [ ] Create PINV.
- [ ] Create PKL.
- [ ] Create TINV.
- [ ] Trigger Shared Data conflict.
- [ ] Preview.
- [ ] PDF.
- [ ] Print.
- [ ] Global Search for project.
- [ ] Run Report.
- [ ] Check Audit.
- [ ] Complete Project.
- [ ] Archive.
- [ ] Backup.
- [ ] Logout.
- [ ] Login.
- [ ] Verify everything persists.

If this journey completes without Bug or Data Loss, we're approaching production behavior.

---

## Key Principle

Every action in the app must be tested 4 times mentally:
1. **Did it work?**
2. **Was it saved?**
3. **Does it persist after refresh?**
4. **Can an unauthorized user do it?**

This is the Real User Acceptance Test baseline for SANAD.
