# SANAD — Open Questions for Client

These questions should be asked before production sign-off. They do not need to block the initial build because implementation defaults exist.

## Documents

1. What exact visual/reference template should be used for each document type?
2. Which of the two SANAD template families is preferred per document/company?
3. Are there any mandatory fields in the client's current Proforma Invoice not listed in the standard spec?
4. Are there any mandatory fields in the client's Tax Invoice not listed?
5. Are there any mandatory fields in the client's Commercial Invoice not listed?
6. Are there any mandatory fields in the client's Packing List not listed?
7. Are there any mandatory fields in the client's Delivery Note not listed?
8. Does the BL require any extra fields beyond the confirmed list?
9. Does Quotation require client-specific commercial terms/sections?
10. Should a blank document number be allowed for draft documents, with number required only before PDF/print/final issue?

## Project data

11. What is the complete list of fields that must be mandatory before creating a Project/Task?
12. Which shipping fields are always known at Project creation versus later?
13. Are container/seal/vessel fields part of Project Shared Data or normally document-specific?
14. Does every Project always have one customer legal entity and one consignee, or can customer and consignee differ?

## Tax/ZATCA

15. Does the client require SANAD to be a fully ZATCA Phase 2 compliant e-invoicing solution, or only to produce their requested printable Tax Invoice/QR?
16. If full compliance is required, what taxpayer integration/wave status applies?
17. Which invoice types are used for B2B versus simplified/B2C?
18. What exact company/buyer tax fields are mandatory in the client's workflow?

## Licensing

19. Verification frequency?
20. License duration options?
21. Grace period if license server is unreachable?
22. What happens on expiry: read-only, block new documents, or full lock?
23. Is license bound to one deployment ID?
24. Are number of users/companies limited by license?

## Backup

25. Required automatic retention period?
26. Should backup include all R2 file bytes in every backup or use snapshot/inventory strategy?
27. Who besides Admin may restore backup?

## Notifications

28. Should desktop/browser push be included later?
29. Should email notifications be planned later?

## Users

30. Should `Manage Users` be grantable to a non-Admin User in production, or remain Admin-only despite configurable architecture?

## Factory Code

31. What exact source column is the stable unique factory identifier?
32. Which columns should be primary filters?
33. Should the system ever display source/import version metadata to normal users?

## Material files

34. Confirm COA is always reusable material-level data for this client's workflow.

## Reports

35. Are there additional mandatory management reports beyond the initial V1 list?
