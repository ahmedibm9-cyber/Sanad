# Performance Report

## Status: Completed

### Workload And Budget

- Workload: k6 mixed read/write load test, 50 virtual users, approximately 8 minutes.
- Baseline fixture: 4,954 documents and 5,205 todos for the load-test company after prior test runs.
- Budget: HTTP p95 below 500ms, HTTP p99 below 1,000ms, failed requests below 1%.
- Baseline: 16,161 requests, 0.00% failed, p95 745.3ms, p99 1,107.8ms, maximum 3,715.7ms.

### Profile Evidence

| Endpoint | Requests | p95 | p99 | Finding |
| --- | ---: | ---: | ---: | --- |
| Document list during dashboard browse | 1,667 | 1,131.1ms | 1,413.3ms | Dominant tail contributor |
| Document list during document workflow | 1,373 | 1,077.1ms | 1,305.1ms | Dominant tail contributor |
| Auth token | 50 | 663.2ms | 765.7ms | Slower than typical REST calls, low volume |

The two document-list endpoints produced 92.9% of p95-tail samples and 95.1% of p99-tail samples. At the aggregate p95 tail, median request waiting time was 894.7ms while connection and response-receive time remained small. This indicates server-side time-to-first-byte rather than client connection setup or payload transfer.

### Database Evidence

The document list query filters by `company_id`, orders by `created_date DESC`, and limits to 50 rows. Its initial plan used a sequential scan and sort over 4,954 documents, taking 51.8ms locally in PostgreSQL. The deployed database lacks a composite index for that access pattern.

### Applied Intervention

`supabase/migrations/20260911045352_company_backup_settings_isolation_and_document_list_index.sql` adds:

- `idx_documents_company_created_date` on `(company_id, created_date DESC)`.
- Tenant-safe `backup_settings` constraints and policies required by the same certification finding.

The migration was applied to the connected Supabase project. The document list plan is now an index scan with 0.158ms execution time.

### Verification

The same 50-VU profile produced 16,783 requests with 0.00% failures, p95 468.0ms, p99 626.5ms, and a 2,268.1ms maximum. The configured p95, p99, and error-rate budgets all passed.

| Metric | Before | After | Change |
| --- | ---: | ---: | ---: |
| Overall p95 | 745.3ms | 468.0ms | -37.2% |
| Overall p99 | 1,107.8ms | 626.5ms | -43.4% |
| Dashboard document-list p95 | 1,131.1ms | 482.7ms | -57.3% |
| Document-workflow list p95 | 1,077.1ms | 468.0ms | -56.5% |

### Remaining Limits

- The baseline is synthetic and was run from one Windows host.
- No database slow-query logs were available from the unified log query; it returned a backend error.
- Test-created rows remain pending cleanup until the broader certification is complete.
