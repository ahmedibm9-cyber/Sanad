# SANAD — Assumptions & Implementation Defaults

These are NOT equal to confirmed Product Owner requirements. They exist so coding can start immediately.

## A-01 Technology
Use a modern TypeScript/React full-stack architecture compatible with Vercel/Railway.

## A-02 Database
Supabase PostgreSQL with RLS.

## A-03 Auth
Use Supabase Auth or a compatible secure auth provider integrated with Supabase identity.

## A-04 Project required details
Beyond confirmed Name + Company + Customer + Materials + Quantities, initially include:
- destination country
- destination city/port optional
- currency
- price per material
- packing per material
- Incoterm optional
- payment terms optional

Do not make optional commercial fields mandatory until approved.

## A-05 Quotation
Use the standard fields in `07_DOCUMENT_ENGINE_SPEC.md`.

## A-06 Proforma/Tax/Commercial/PKL/DN
Use standard export document fields in `07_DOCUMENT_ENGINE_SPEC.md` until the client provides/approves templates.

## A-07 BL
Use confirmed fields plus optional Place of Receipt, Place of Delivery and Freight Terms.

## A-08 Customer fields
Use conventional business contact/address/tax fields.

## A-09 Bank accounts
Support multiple company bank accounts even though only one may be used initially.

## A-10 Backup retention
Default 7 daily + 4 weekly until client confirms.

## A-11 License outage
Use a short configurable grace period; do not hard-lock instantly on a transient network outage.

## A-12 File size
Set a safe configurable application upload limit; do not hard-code a tiny limit.

## A-13 Currency
Initial configured currency can be SAR; settings allow adding EGP, USD, EUR and others.

## A-14 Weight
Initial default MT; configurable.

## A-15 Packing units
Seed Bags, Tanks, Jerry Cans; configurable.

## A-16 UI
Desktop-first responsive web app.

## A-17 Hard delete
Do not expose hard delete in normal operational UI.

## A-18 Document finalization
A user can save/edit a document before PDF output; final PDF uses latest current values.

## A-19 Search
Use normalized case-insensitive partial search with database indexes/full-text/trigram strategy as appropriate.

## A-20 Factory import
Use staging table then merge for safety.
