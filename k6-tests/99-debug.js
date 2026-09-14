// SANAD k6 Debug Script — Tests each operation individually
// Run: k6 run 99-debug.js

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { SUPABASE_URL, SUPABASE_ANON_KEY, AUTH_URL, REST_URL, TEST_EMAIL_PREFIX, TEST_EMAIL_DOMAIN, TEST_PASSWORD, anonHeaders, authHeaders } from './config.js';
import { signup, login, getProfile, getMemberships, getWorkItems, getDocuments, createDocument, updateDocument, getCustomers, getMaterials, searchWorkItems, searchCustomers, getAuditEvents, getCompanySettings, getCompanyAssets, createTodo, toggleTodo, getTodoStats } from './helpers.js';

export const options = { vus: 1, iterations: 1, maxDuration: '2m' };

export default function () {
  const vu = __VU;
  const email = `${TEST_EMAIL_PREFIX}${vu}@${TEST_EMAIL_DOMAIN}`;
  const password = TEST_PASSWORD;

  // Auth
  group('Auth', () => {
    const lr = login(vu);
    if (!lr || !lr.access_token) {
      console.error(`VU${vu}: Login failed`);
      return;
    }
  });

  const lr = login(vu);
  if (!lr || !lr.access_token) {
    console.error(`VU${vu}: Login failed — aborting`);
    return;
  }
  const token = lr.access_token;
  const userId = lr.user_id;

  const profile = getProfile(token, userId);
  const memberships = getMemberships(token, userId);
  console.log(`VU${vu}: userId=${userId}, memberships=${JSON.stringify(memberships)}`);

  let companyId = null;
  if (memberships && memberships.length > 0) {
    companyId = memberships[0].company_id;
  }
  console.log(`VU${vu}: companyId=${companyId}`);

  if (!companyId) {
    console.error(`VU${vu}: NO COMPANY — all writes will fail`);
    return;
  }

  const h = { headers: authHeaders(token) };

  // Test each operation
  const operations = [
    { name: 'getWorkItems', fn: () => http.get(`${REST_URL}/work_items?select=*&company_id=eq.${companyId}&limit=5`, h) },
    { name: 'getDocuments', fn: () => http.get(`${REST_URL}/documents?select=*&company_id=eq.${companyId}&limit=5`, h) },
    { name: 'getCustomers', fn: () => http.get(`${REST_URL}/customers?select=*&company_id=eq.${companyId}&limit=5`, h) },
    { name: 'getMaterials', fn: () => http.get(`${REST_URL}/materials?select=*&company_id=eq.${companyId}&limit=5`, h) },
    { name: 'searchWorkItems', fn: () => http.get(`${REST_URL}/work_items?select=*&company_id=eq.${companyId}&or=(title.ilike.*test*,reference_number.ilike.*test*)&limit=10`, h) },
    { name: 'searchCustomers', fn: () => http.get(`${REST_URL}/customers?select=*&company_id=eq.${companyId}&name=ilike.*al*&limit=20`, h) },
    { name: 'getAuditEvents', fn: () => http.get(`${REST_URL}/audit_events?select=*&company_id=eq.${companyId}&limit=5`, h) },
    { name: 'getCompanySettings', fn: () => http.get(`${REST_URL}/company_settings?select=*&company_id=eq.${companyId}&limit=1`, h) },
    { name: 'getCompanyAssets', fn: () => http.get(`${REST_URL}/company_assets?select=*&company_id=eq.${companyId}&limit=5`, h) },
    { name: 'getFactoryCodeRecords', fn: () => http.get(`${REST_URL}/factory_code_records?limit=5`, h) },
    { name: 'getTodos', fn: () => http.get(`${REST_URL}/todos?select=*&user_id=eq.${userId}&limit=5`, h) },
  ];

  for (const op of operations) {
    const res = op.fn();
    const status = res.status;
    const body = res.body ? res.body.substring(0, 200) : '';
    console.log(`  ${op.name}: HTTP ${status} ${status === 200 ? '✓' : '✗'} ${status !== 200 ? body : ''}`);
  }

  // Test writes
  console.log('\n--- WRITE TESTS ---');

  const doc = createDocument(token, companyId);
  console.log(`  createDocument: ${doc ? '✓ OK id=' + doc.id : '✗ FAILED'}`);

  if (doc) {
    const updated = updateDocument(token, doc.id);
    console.log(`  updateDocument: ${updated ? '✓ OK' : '✗ FAILED'}`);
  }

  const todo = createTodo(token, userId, companyId);
  console.log(`  createTodo: ${todo ? '✓ OK id=' + todo.id : '✗ FAILED'}`);

  if (todo) {
    const toggled = toggleTodo(token, todo.id, 'pending');
    console.log(`  toggleTodo: ${toggled ? '✓ OK' : '✗ FAILED'}`);
  }
}
