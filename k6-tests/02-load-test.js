// SANAD k6 Load Test (Main)
// ==========================
// 50 concurrent users × ~8 minutes.
// Simulates realistic mixed workload: browsing, searching, CRUD.
// Run: k6 run 02-load-test.js

import { check, sleep, group } from 'k6';
import { THRESHOLDS } from './config.js';
import {
  signup,
  login,
  getProfile,
  getMemberships,
  getWorkItems,
  getDocuments,
  createDocument,
  updateDocument,
  getCustomers,
  getMaterials,
  searchWorkItems,
  searchCustomers,
  getAuditEvents,
  getCompanySettings,
  getCompanyAssets,
  getFactoryCodeRecords,
  createTodo,
  toggleTodo,
  getTodoStats,
  randomItem,
  randomString,
} from './helpers.js';

export const options = {
  scenarios: {
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },   // warmup
        { duration: '1m',  target: 30 },   // ramp up
        { duration: '3m',  target: 50 },   // sustained load
        { duration: '2m',  target: 50 },   // peak
        { duration: '30s', target: 0 },    // cooldown
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: THRESHOLDS,
};

// Per-VU state (each VU gets its own copy)
const vuState = {};

function getState() {
  const id = __VU;
  if (!vuState[id]) {
    vuState[id] = {
      token: null,
      userId: null,
      companyId: null,
      authenticated: false,
      iteration: 0,
      docIds: [],
      todoIds: [],
    };
  }
  return vuState[id];
}

export default function () {
  const state = getState();
  state.iteration++;

  // ── Auth Phase (first iteration only) ──
  if (!state.authenticated) {
    group('Auth', () => {
      const result = signup(__VU);
      if (result) {
        state.token = result.access_token;
        state.userId = result.user_id;
        state.authenticated = true;
      }
    });

    if (!state.authenticated) {
      console.error(`VU ${__VU}: Auth failed, skipping iteration`);
      sleep(2);
      return;
    }

    group('Auth: Load Profile', () => {
      getProfile(state.token, state.userId);
      sleep(0.1);
      const memberships = getMemberships(state.token, state.userId);
      if (memberships && memberships.length > 0) {
        state.companyId = memberships[0].company_id;
      }
    });

    if (!state.companyId) {
      console.warn(`VU ${__VU}: No company — read-only mode`);
      sleep(1);
      return;
    }
  }

  const token = state.token;
  const companyId = state.companyId;

  // ── Randomized workload distribution ──
  // Each iteration picks one scenario based on weighted random
  const roll = Math.random() * 100;

  if (roll < 30) {
    // ── 30%: Dashboard Browse ──
    group('Browse: Dashboard', () => {
      getWorkItems(token, companyId);
      sleep(randomSleep(0.3, 0.8));
      getDocuments(token, companyId);
      sleep(randomSleep(0.2, 0.5));
      getAuditEvents(token, companyId);
      sleep(randomSleep(0.1, 0.3));
      getTodoStats(token, state.userId);
    });
  } else if (roll < 55) {
    // ── 25%: Document CRUD ──
    group('Document: Read', () => {
      const docs = getDocuments(token, companyId);
      sleep(randomSleep(0.2, 0.5));

      // Update one document if we have any
      if (docs && docs.length > 0) {
        const doc = randomItem(docs);
        updateDocument(token, doc.id);
      }
    });

    sleep(randomSleep(0.3, 0.6));

    // Create a new document (50% chance per iteration to avoid explosion)
    if (Math.random() < 0.5) {
      group('Document: Create', () => {
        const doc = createDocument(token, companyId);
        if (doc) state.docIds.push(doc.id);
      });
    }
  } else if (roll < 70) {
    // ── 15%: Customer/Material Browse ──
    group('Browse: Customers & Materials', () => {
      getCustomers(token, companyId);
      sleep(randomSleep(0.2, 0.4));
      getMaterials(token, companyId);
      sleep(randomSleep(0.2, 0.4));
      getCompanyAssets(token, companyId);
    });
  } else if (roll < 80) {
    // ── 10%: Search ──
    group('Search', () => {
      const queries = ['al', 'test', 'plast', 'chem', 'saud', 'hdpe', 'pp', 'invest'];
      const q = randomItem(queries);

      if (Math.random() < 0.5) {
        searchWorkItems(token, companyId, q);
      } else {
        searchCustomers(token, companyId, q);
      }
    });
  } else if (roll < 90) {
    // ── 10%: Todo CRUD ──
    group('Todos', () => {
      // Create a todo
      const todo = createTodo(token, state.userId, companyId);
      if (todo) {
        state.todoIds.push(todo.id);
        sleep(randomSleep(0.2, 0.4));

        // Toggle it
        toggleTodo(token, todo.id, 'pending');
      }
      sleep(randomSleep(0.1, 0.3));
      getTodoStats(token, state.userId);
    });
  } else {
    // ── 10%: Settings & Config ──
    group('Reads: Settings', () => {
      getCompanySettings(token, companyId);
      sleep(randomSleep(0.2, 0.5));
      getFactoryCodeRecords(token);
    });
  }

  sleep(randomSleep(0.5, 1.5));
}

function randomSleep(min, max) {
  return min + Math.random() * (max - min);
}

export function handleSummary(data) {
  const m = data.metrics;
  const httpReqs = m.http_reqs?.values?.count || 0;
  const httpFailures = m.http_req_failed?.values?.rate || 0;
  const p95 = m.http_req_duration?.values?.['p(95)'] || 0;
  const p99 = m.http_req_duration?.values?.['p(99)'] || 0;
  const avg = m.http_req_duration?.values?.avg || 0;
  const max = m.http_req_duration?.values?.max || 0;
  const rps = m.http_reqs?.values?.rate || 0;

  const signupD = m.supabase_signup_duration?.values?.avg || 0;
  const loginD = m.supabase_login_duration?.values?.avg || 0;
  const signups = m.supabase_signups?.values?.count || 0;
  const logins = m.supabase_logins?.values?.count || 0;
  const authFails = m.supabase_auth_failures?.values?.count || 0;

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  SANAD LOAD TEST RESULTS (50 Users × ~8 min)');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`  Total Requests:    ${httpReqs}`);
  console.log(`  Requests/sec:      ${rps.toFixed(1)}`);
  console.log(`  Error Rate:        ${(httpFailures * 100).toFixed(2)}%`);
  console.log(`  Avg Latency:       ${avg.toFixed(0)}ms`);
  console.log(`  p95 Latency:       ${p95.toFixed(0)}ms`);
  console.log(`  p99 Latency:       ${p99.toFixed(0)}ms`);
  console.log(`  Max Latency:       ${max.toFixed(0)}ms`);
  console.log('──────────────────────────────────────────────────────────');
  console.log(`  Signups:           ${signups}`);
  console.log(`  Logins:            ${logins}`);
  console.log(`  Auth Failures:     ${authFails}`);
  console.log(`  Avg Signup Time:   ${signupD.toFixed(0)}ms`);
  console.log(`  Avg Login Time:    ${loginD.toFixed(0)}ms`);
  console.log('══════════════════════════════════════════════════════════');

  // Pass/fail verdict
  const failed = httpFailures > 0.01 || p95 > 500;
  console.log(`\n  VERDICT: ${failed ? '❌ FAILED — Thresholds breached' : '✅ PASSED — All thresholds met'}\n`);

  return {};
}
