# SANAD — Factory Code Module Specification

## Purpose

Shared read-only searchable master dataset derived from periodically updated Excel source.

## Initial scale

Approximately 13,590 records, ~25 MB source file.

Design for growth beyond this size.

## Search

One search box across all meaningful searchable columns.

Search should handle:
- partial text
- partial numeric strings
- product/grade
- HS code
- factory code
- names
- locations
- any relevant source field

Example `952` may match multiple unrelated fields; return all with match context.

## Filters

Build filters from actual dataset columns, not invented fixed fields.

Potential categories:
- city/region
- activity
- product
- HS code
- factory identifier

## Export

- filtered result to `.xlsx`
- full dataset to `.xlsx`

Excel should have:
- proper columns
- readable widths
- header styling
- filters
- frozen header
- correct text/number treatment

## Import/update

Admin selects updated Excel file.

Flow:
1. upload
2. validate headers
3. show preview
4. compute merge
5. confirmation
6. run smart update
7. show summary

Rules:
- add new
- update changed
- retain unchanged
- never delete old records because absent from new source

## Identity matching

Use strongest stable source identifier if one exists.

If no stable ID exists, define a canonical composite key from reliable columns and keep normalization deterministic.

Do not match records solely on fuzzy name similarity for destructive update.

## Audit

Log:
- source filename
- uploader
- counts
- timestamp
- failures

Store original import file in R2.
