// SANAD k6 Smoke Test
// ====================
// Quick validation: 5 VUs × 1 minute.
// Verifies auth, basic reads, and one write per VU.
// Run: k6 run 01-smoke-test.js

import { check, sleep, group } from 'k6';
import { SMOKE_THRESHOLDS } from './config.js';
import {
  signup,
  login,
  getProfile,
  getMemberships,
  getWorkItems,
  getDocuments,
  createDocument,
  getCustomers,
  getMaterials,
  searchWorkItems,
  searchCustomers,
  getAuditEvents,
  getCompanySettings,
  createTodo,
  getTodoStats,
} from './helpers.js';

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
    },
  },
  thresholds: SMOKE_THRESHOLDS,
};

// Shared state across iterations per VU
const vuState = {
  token: null,
  userId: null,
  companyId: null,
  docsCreated: 0,
};

export default function () {
  // ── Phase 1: Auth (every VU, first iteration) ──
  if (!vuState.token) {
    const VU_ID = __VU;

    group('Auth: Signup + Login', () => {
      const result = signup(VU_ID);
      if (result) {
        vuState.token = result.access_token;
        vuState.userId = result.user_id;
      }
    });

    if (!vuState.token) {
      console.error(`VU ${VU_ID}: Failed to authenticate`);
      return;
    }

    // Get company membership
    group('Auth: Get Profile + Membership', () => {
      const profile = getProfile(vuState.token, vuState.userId);
      const memberships = getMemberships(vuState.token, vuState.userId);
      if (memberships && memberships.length > 0) {
        vuState.companyId = memberships[0].company_id;
      }
    });

    if (!vuState.companyId) {
      console.warn(`VU ${__VU}: No company membership found — read-only tests only`);
    }
  }

  const token = vuState.token;
  const companyId = vuState.companyId;

  // ── Phase 2: Read Operations ──
  group('Reads: Dashboard Data', () => {
    if (companyId) {
      getWorkItems(token, companyId);
      sleep(0.2);
      getDocuments(token, companyId);
      sleep(0.2);
      getCustomers(token, companyId);
      sleep(0.2);
      getMaterials(token, companyId);
    }
  });

  sleep(0.5);

  group('Reads: Search', () => {
    if (companyId) {
      searchWorkItems(token, companyId, 'test');
      sleep(0.2);
      searchCustomers(token, companyId, 'al');
    }
  });

  sleep(0.5);

  group('Reads: Supporting Data', () => {
    if (companyId) {
      getAuditEvents(token, companyId);
      sleep(0.2);
      getCompanySettings(token, companyId);
    }
  });

  sleep(0.5);

  // ── Phase 3: Todo Operations ──
  group('Todos: Create + Stats', () => {
    if (vuState.userId) {
      const todo = createTodo(token, vuState.userId, companyId);
      sleep(0.3);
      getTodoStats(token, vuState.userId);
    }
  });

  sleep(0.5);

  // ── Phase 4: Document Write (1 per VU) ──
  if (vuState.docsCreated < 1 && companyId) {
    group('Write: Create Document', () => {
      const doc = createDocument(token, companyId);
      if (doc) vuState.docsCreated++;
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  const metrics = data.metrics;
  const httpReqs = metrics.http_reqs?.values?.count || 0;
  const httpFailures = metrics.http_req_failed?.values?.rate || 0;
  const p95 = metrics.http_req_duration?.values?.['p(95)'] || 0;
  const p99 = metrics.http_req_duration?.values?.['p(99)'] || 0;
  const avg = metrics.http_req_duration?.values?.avg || 0;

  console.log('\n══════════════════════════════════════');
  console.log('  SANAD SMOKE TEST RESULTS');
  console.log('══════════════════════════════════════');
  console.log(`  Total Requests:  ${httpReqs}`);
  console.log(`  Error Rate:      ${(httpFailures * 100).toFixed(2)}%`);
  console.log(`  Avg Latency:     ${avg.toFixed(0)}ms`);
  console.log(`  p95 Latency:     ${p95.toFixed(0)}ms`);
  console.log(`  p99 Latency:     ${p99.toFixed(0)}ms`);
  console.log('══════════════════════════════════════\n');

  return {};
}
