// SANAD k6 Stress Test (Write-Heavy)
// ====================================
// 50 concurrent users × ~5 minutes, focus on write operations.
// Tests database write throughput, concurrent inserts, and update conflicts.
// Run: k6 run 03-stress-test.js

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
  createTodo,
  toggleTodo,
  getTodoStats,
  getCustomers,
  getMaterials,
  randomItem,
  randomString,
  randomDocNumber,
} from './helpers.js';
import { REST_URL, authHeaders } from './config.js';
import http from 'k6/http';

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 },   // warmup
        { duration: '30s', target: 30 },   // ramp
        { duration: '2m',  target: 50 },   // sustained
        { duration: '1m',  target: 50 },   // peak
        { duration: '30s', target: 0 },    // cooldown
      ],
      gracefulRampDown: '20s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<600', 'p(99)<1200'],  // slightly relaxed for write-heavy
    http_req_failed: ['rate<0.02'],
    checks: ['rate>0.98'],
  },
};

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
    };
  }
  return vuState[id];
}

export default function () {
  const state = getState();
  state.iteration++;

  // ── Auth Phase ──
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
      sleep(2);
      return;
    }

    group('Auth: Load Profile', () => {
      getProfile(state.token, state.userId);
      const memberships = getMemberships(state.token, state.userId);
      if (memberships && memberships.length > 0) {
        state.companyId = memberships[0].company_id;
      }
    });

    if (!state.companyId) {
      sleep(1);
      return;
    }
  }

  const token = state.token;
  const companyId = state.companyId;

  // ── Write-heavy workload ──
  const roll = Math.random() * 100;

  if (roll < 40) {
    // ── 40%: Document Create (heavy writes) ──
    group('Write: Document Create', () => {
      const docType = randomItem(['QUOT', 'PINV', 'TINV', 'CINV', 'PKL', 'DN', 'BL']);
      const payload = JSON.stringify({
        company_id: companyId,
        type: docType,
        number: randomDocNumber(docType),
        date: new Date().toISOString().split('T')[0],
        language: 'en',
        template: 'default',
        prepared_by: `Stress Test VU${__VU}`,
        status: 'draft',
      });

      const params = { headers: { ...authHeaders(token), Prefer: 'return=representation' }, tags: { operation: 'stress_create_doc' } };
      const res = http.post(`${REST_URL}/documents`, payload, params);
      check(res, { 'stress: doc created (201)': (r) => r.status === 201 });
    });
  } else if (roll < 65) {
    // ── 25%: Document Read + Update ──
    group('Write: Document Update', () => {
      const params = { headers: authHeaders(token) };
      const listRes = http.get(
        `${REST_URL}/documents?select=id,status&company_id=eq.${companyId}&limit=20`,
        params
      );

      if (listRes.status === 200) {
        const docs = listRes.json();
        if (docs && docs.length > 0) {
          const doc = randomItem(docs);
          const updatePayload = JSON.stringify({
            status: randomItem(['draft', 'sent', 'approved']),
          });
          const updateRes = http.patch(
            `${REST_URL}/documents?id=eq.${doc.id}`,
            updatePayload,
            { headers: authHeaders(token), tags: { operation: 'stress_update_doc' } }
          );
          check(updateRes, { 'stress: doc updated (200)': (r) => r.status === 200 });
        }
      }
    });
  } else if (roll < 80) {
    // ── 15%: Todo Batch Create ──
    group('Write: Todo Batch', () => {
      for (let i = 0; i < 3; i++) {
        const payload = JSON.stringify({
          title: `Stress task ${randomString(6)}`,
          description: `Auto-generated during stress test`,
          is_done: false,
          priority: randomItem(['low', 'medium', 'high']),
          user_id: state.userId,
          company_id: companyId,
        });

        const params = { headers: authHeaders(token), tags: { operation: 'stress_create_todo' } };
        const res = http.post(`${REST_URL}/todos`, payload, params);
        check(res, { 'stress: todo created (201)': (r) => r.status === 201 });
        sleep(0.1);
      }
    });
  } else if (roll < 90) {
    // ── 10%: Concurrent Read Storm ──
    group('Read: Concurrent Storm', () => {
      const urls = [
        `${REST_URL}/work_items?select=*,customers(name)&company_id=eq.${companyId}&limit=20`,
        `${REST_URL}/documents?select=*&company_id=eq.${companyId}&limit=20`,
        `${REST_URL}/customers?select=*&company_id=eq.${companyId}&limit=20`,
        `${REST_URL}/materials?select=*&company_id=eq.${companyId}&limit=20`,
        `${REST_URL}/audit_events?select=*&company_id=eq.${companyId}&limit=20`,
      ];

      const params = { headers: authHeaders(token) };
      const responses = urls.map(url => http.get(url, params));

      responses.forEach((res, i) => {
        check(res, { [`stress: concurrent read ${i} ok`]: (r) => r && r.status === 200 });
      });
    });
  } else {
    // ── 10%: Todo Toggle ──
    group('Write: Todo Toggle', () => {
      const params = { headers: authHeaders(token) };
      const listRes = http.get(
        `${REST_URL}/todos?select=id,is_done&user_id=eq.${state.userId}&limit=10`,
        params
      );

      if (listRes.status === 200) {
        const todos = listRes.json();
        if (todos && todos.length > 0) {
          const todo = randomItem(todos);
          const newDone = todo.is_done === true ? false : true;
          const toggleRes = http.patch(
            `${REST_URL}/todos?id=eq.${todo.id}`,
            JSON.stringify({ is_done: newDone }),
            { headers: authHeaders(token), tags: { operation: 'stress_toggle_todo' } }
          );
          check(toggleRes, { 'stress: todo toggled (200)': (r) => r.status === 200 });
        }
      }
    });
  }

  sleep(0.3 + Math.random() * 0.7);
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

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  SANAD STRESS TEST RESULTS (50 Users Write-Heavy)');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`  Total Requests:    ${httpReqs}`);
  console.log(`  Requests/sec:      ${rps.toFixed(1)}`);
  console.log(`  Error Rate:        ${(httpFailures * 100).toFixed(2)}%`);
  console.log(`  Avg Latency:       ${avg.toFixed(0)}ms`);
  console.log(`  p95 Latency:       ${p95.toFixed(0)}ms`);
  console.log(`  p99 Latency:       ${p99.toFixed(0)}ms`);
  console.log(`  Max Latency:       ${max.toFixed(0)}ms`);
  console.log('══════════════════════════════════════════════════════════');

  const failed = httpFailures > 0.02 || p95 > 600;
  console.log(`\n  VERDICT: ${failed ? '❌ FAILED — Thresholds breached' : '✅ PASSED — All thresholds met'}\n`);

  return {};
}
