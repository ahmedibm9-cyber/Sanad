// SANAD k6 Test Helpers
// =====================
// Reusable functions for authentication, data generation, and API calls.

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY,
  AUTH_URL,
  REST_URL,
  TEST_EMAIL_PREFIX,
  TEST_EMAIL_DOMAIN,
  TEST_PASSWORD,
  authHeaders,
  anonHeaders,
  DOCUMENT_TYPES,
  STATUSES,
  ORIGINS,
  HS_CODES,
} from './config.js';

// Custom metrics
export const signupCount = new Counter('supabase_signups');
export const loginCount = new Counter('supabase_logins');
export const authFailures = new Counter('supabase_auth_failures');
export const loginDuration = new Trend('supabase_login_duration', true);
export const signupDuration = new Trend('supabase_signup_duration', true);

// ===========================================
// Data Generators
// ===========================================

export function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomString(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function randomCompanyName() {
  const prefixes = ['Al', 'Bin', 'Al-', ''];
  const names = ['Faisal', 'Rashid', 'Omar', 'Khalid', 'Saud', 'Nasser', 'Abdullah', 'Hassan'];
  const suffixes = ['Trading', 'Industries', 'Group', 'LLC', 'Co.', 'Est.'];
  return `${randomItem(prefixes)}${randomItem(names)} ${randomItem(suffixes)}`.trim();
}

export function randomDocNumber(type) {
  const year = new Date().getFullYear();
  const seq = String(randomInt(1, 999999)).padStart(6, '0');
  return `${type}-${year}-${seq}`;
}

export function randomMaterial() {
  const grades = ['HDPE 5000S', 'HDPE 6200B', 'PP R520T', 'LLDPE 7042', 'LDPE 2100TN00', 'PVC S-65'];
  return randomItem(grades);
}

export function generateTodoData(userId, companyId) {
  const titles = [
    'Follow up with customer about shipment',
    'Review quotation for accuracy',
    'Update material prices in system',
    'Prepare commercial invoice',
    'Check factory code documentation',
    'Schedule inspection for project',
    'Update project status report',
    'Send packing list to warehouse',
    'Verify HS codes for new materials',
    'Review and approve backup settings',
  ];
  return {
    title: randomItem(titles),
    description: `Auto-generated task ${randomString(8)}`,
    is_done: randomItem([false, false, false, true]),
    priority: randomItem(['low', 'medium', 'high']),
    user_id: userId,
    company_id: companyId,
  };
}

// ===========================================
// Authentication
// ===========================================

/**
 * Sign up a new test user.
 * Strategy: try login first (handles existing users), then signup with auto-confirm.
 * Returns { access_token, refresh_token, user_id } or null on failure.
 */
export function signup(vuId) {
  // Try login first — most VUs will already exist from prior runs
  const loginResult = login(vuId);
  if (loginResult) return loginResult;

  // User doesn't exist — sign up
  const email = `${TEST_EMAIL_PREFIX}${String(vuId).padStart(2, '0')}@${TEST_EMAIL_DOMAIN}`;
  const payload = JSON.stringify({
    email: email,
    password: TEST_PASSWORD,
    data: {
      display_name: `Load Test User ${vuId}`,
      preferred_language: 'en',
    },
  });

  const params = { headers: anonHeaders() };
  const res = http.post(`${AUTH_URL}/signup`, payload, params);

  signupDuration.add(res.timings.duration);

  if (res.status === 200) {
    const body = res.json();

    // If GoTrue returned a token directly (email confirmation disabled), use it
    if (body.access_token) {
      signupCount.add(1);
      return {
        access_token: body.access_token,
        refresh_token: body.refresh_token,
        user_id: body.user?.id || body.id,
      };
    }

    // Email confirmation required — auto-confirm via Admin API, then login
    if (body.id) {
      const adminHeaders = {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      };

      const confirmRes = http.post(
        `${AUTH_URL}/admin/users/${body.id}/confirm`,
        '{}',
        { headers: adminHeaders }
      );

      if (confirmRes.status === 200 || confirmRes.status === 204) {
        signupCount.add(1);
        // Now login with confirmed account
        return login(vuId);
      } else {
        console.error(`Auto-confirm failed for ${email}: ${confirmRes.status} ${confirmRes.body}`);
      }
    }
  }

  authFailures.add(1);
  return null;
}

/**
 * Log in an existing test user.
 * Returns { access_token, refresh_token, user_id } or null on failure.
 */
export function login(vuId) {
  const email = `${TEST_EMAIL_PREFIX}${String(vuId).padStart(2, '0')}@${TEST_EMAIL_DOMAIN}`;
  const payload = JSON.stringify({
    email: email,
    password: TEST_PASSWORD,
    grant_type: 'password',
  });

  const params = { headers: anonHeaders() };
  const res = http.post(`${AUTH_URL}/token?grant_type=password`, payload, params);

  const success = check(res, {
    'login: status 200': (r) => r.status === 200,
  });

  loginDuration.add(res.timings.duration);

  if (res.status === 200) {
    loginCount.add(1);
    const body = res.json();
    return {
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      user_id: body.user?.id,
    };
  }

  authFailures.add(1);
  return null;
}

/**
 * Get user profile from the users table.
 */
export function getProfile(token, userId) {
  const params = { headers: authHeaders(token) };
  const res = http.get(`${REST_URL}/users?id=eq.${userId}&select=*`, params);
  check(res, { 'getProfile: status 200': (r) => r.status === 200 });
  return res.status === 200 ? res.json() : null;
}

/**
 * Get company memberships for a user.
 */
export function getMemberships(token, userId) {
  const params = { headers: authHeaders(token) };
  const res = http.get(
    `${REST_URL}/company_memberships?user_id=eq.${userId}&select=company_id,base_role,active`,
    params
  );
  check(res, { 'getMemberships: status 200': (r) => r.status === 200 });
  if (res.status !== 200) {
    console.error(`getMemberships failed: ${res.status} ${res.body}`);
    return [];
  }
  const data = res.json();
  if (!data || data.length === 0) {
    console.error(`getMemberships: empty for userId=${userId}, status=${res.status}`);
  }
  return data || [];
}

// ===========================================
// CRUD Operations
// ===========================================

/**
 * Fetch work items (projects/tasks) with customer join.
 */
export function getWorkItems(token, companyId) {
  const params = { headers: authHeaders(token) };
  const res = http.get(
    `${REST_URL}/work_items?select=*,customers(name)&company_id=eq.${companyId}&order=created_at.desc&limit=50`,
    params
  );
  check(res, { 'getWorkItems: status 200': (r) => r.status === 200 });
  return res.status === 200 ? res.json() : [];
}

/**
 * Fetch documents for a company.
 */
export function getDocuments(token, companyId) {
  const params = { headers: authHeaders(token) };
  const res = http.get(
    `${REST_URL}/documents?select=*&company_id=eq.${companyId}&order=created_date.desc&limit=50`,
    params
  );
  check(res, { 'getDocuments: status 200': (r) => r.status === 200 });
  return res.status === 200 ? res.json() : [];
}

/**
 * Create a new work item (project/task).
 */
export function createWorkItem(token, companyId) {
  const payload = JSON.stringify({
    company_id: companyId,
    type: 'project',
    name: `Load Test Project ${randomString(6)}`,
    status: 'in_progress',
  });

  const params = { headers: { ...authHeaders(token), Prefer: 'return=representation' }, tags: { operation: 'create_work_item' } };
  const res = http.post(`${REST_URL}/work_items`, payload, params);
  check(res, { 'createWorkItem: status 201': (r) => r.status === 201 });
  return res.status === 201 ? res.json() : null;
}

/**
 * Create a new document.
 */
export function createDocument(token, companyId, workItemId) {
  const docType = randomItem(DOCUMENT_TYPES);

  const payload = JSON.stringify({
    company_id: companyId,
    work_item_id: workItemId || null,
    type: docType,
    number: randomDocNumber(docType),
    date: new Date().toISOString().split('T')[0],
    language: 'en',
    template: 'template-a',
    prepared_by: 'Load Test',
    status: 'draft',
    metadata: {
      subtotal: randomInt(1000, 100000),
      vatRate: 15,
      origin: randomItem(ORIGINS),
      descriptionOfGoods: randomMaterial(),
      deliveryTime: `${randomInt(5, 30)} business days`,
    },
  });

  const params = { headers: { ...authHeaders(token), Prefer: 'return=representation' }, tags: { operation: 'create_document' } };
  const res = http.post(`${REST_URL}/documents`, payload, params);
  check(res, { 'createDocument: status 201': (r) => r.status === 201 });
  return res.status === 201 ? res.json()[0] : null;
}

/**
 * Update an existing document.
 */
export function updateDocument(token, docId) {
  const payload = JSON.stringify({
    status: randomItem(['draft', 'sent', 'approved']),
    metadata: {
      subtotal: randomInt(1000, 100000),
      notes: `Updated by load test at ${new Date().toISOString()}`,
    },
  });

  const params = { headers: authHeaders(token), tags: { operation: 'update_document' } };
  const res = http.patch(`${REST_URL}/documents?id=eq.${docId}`, payload, params);
  const ok = res.status === 200 || res.status === 204;
  check(res, { 'updateDocument: status 200 or 204': (r) => r.status === 200 || r.status === 204 });
  if (!ok) {
    console.error(`updateDocument FAILED: status=${res.status} docId=${docId} body=${res.body}`);
  }
  return ok;
}

/**
 * Fetch customers for a company.
 */
export function getCustomers(token, companyId) {
  const params = { headers: authHeaders(token) };
  const res = http.get(
    `${REST_URL}/customers?select=*&company_id=eq.${companyId}&active=eq.true&limit=50`,
    params
  );
  check(res, { 'getCustomers: status 200': (r) => r.status === 200 });
  return res.status === 200 ? res.json() : [];
}

/**
 * Fetch materials for a company.
 */
export function getMaterials(token, companyId) {
  const params = { headers: authHeaders(token) };
  const res = http.get(
    `${REST_URL}/materials?select=*&company_id=eq.${companyId}&active=eq.true&limit=50`,
    params
  );
  check(res, { 'getMaterials: status 200': (r) => r.status === 200 });
  return res.status === 200 ? res.json() : [];
}

/**
 * Search work items by name.
 */
export function searchWorkItems(token, companyId, query) {
  const params = { headers: authHeaders(token) };
  const res = http.get(
    `${REST_URL}/work_items?select=*&company_id=eq.${companyId}&name=ilike.*${query}*&limit=20`,
    params
  );
  check(res, { 'searchWorkItems: status 200': (r) => r.status === 200 });
  return res.status === 200 ? res.json() : [];
}

/**
 * Search customers by name.
 */
export function searchCustomers(token, companyId, query) {
  const params = { headers: authHeaders(token) };
  const res = http.get(
    `${REST_URL}/customers?select=*&company_id=eq.${companyId}&name=ilike.*${query}*&limit=20`,
    params
  );
  check(res, { 'searchCustomers: status 200': (r) => r.status === 200 });
  return res.status === 200 ? res.json() : [];
}

/**
 * Create a todo item.
 */
export function createTodo(token, userId, companyId) {
  const data = generateTodoData(userId, companyId);
  const payload = JSON.stringify(data);

  const params = { headers: { ...authHeaders(token), Prefer: 'return=representation' }, tags: { operation: 'create_todo' } };
  const res = http.post(`${REST_URL}/todos`, payload, params);
  check(res, { 'createTodo: status 201': (r) => r.status === 201 });
  return res.status === 201 ? res.json()[0] : null;
}

/**
 * Toggle todo completion status.
 */
export function toggleTodo(token, todoId, currentStatus) {
  const newDone = currentStatus === 'done' ? false : true;
  const payload = JSON.stringify({ is_done: newDone });

  const params = { headers: authHeaders(token), tags: { operation: 'toggle_todo' } };
  const res = http.patch(`${REST_URL}/todos?id=eq.${todoId}`, payload, params);
  const ok = res.status === 200 || res.status === 204;
  check(res, { 'toggleTodo: status 200 or 204': (r) => r.status === 200 || r.status === 204 });
  return ok;
}

/**
 * Fetch todo stats.
 */
export function getTodoStats(token, userId) {
  const params = { headers: authHeaders(token) };
  const res = http.get(
    `${REST_URL}/todos?select=id,is_done,priority,due_date&user_id=eq.${userId}&limit=100`,
    params
  );
  check(res, { 'getTodoStats: status 200': (r) => r.status === 200 });
  return true;
}

/**
 * Fetch audit events.
 */
export function getAuditEvents(token, companyId) {
  const params = { headers: authHeaders(token) };
  const res = http.get(
    `${REST_URL}/audit_events?select=*&company_id=eq.${companyId}&order=created_at.desc&limit=50`,
    params
  );
  check(res, { 'getAuditEvents: status 200': (r) => r.status === 200 });
  return res.status === 200 ? res.json() : [];
}

/**
 * Fetch company settings.
 */
export function getCompanySettings(token, companyId) {
  const params = { headers: authHeaders(token) };
  const res = http.get(
    `${REST_URL}/company_settings?select=*&company_id=eq.${companyId}`,
    params
  );
  check(res, { 'getCompanySettings: status 200': (r) => r.status === 200 });
  return res.status === 200 ? res.json() : [];
}

/**
 * Fetch company assets.
 */
export function getCompanyAssets(token, companyId) {
  const params = { headers: authHeaders(token) };
  const res = http.get(
    `${REST_URL}/company_assets?select=*&company_id=eq.${companyId}`,
    params
  );
  check(res, { 'getCompanyAssets: status 200': (r) => r.status === 200 });
  return res.status === 200 ? res.json() : [];
}

/**
 * Fetch factory code records (global shared table).
 */
export function getFactoryCodeRecords(token) {
  const params = { headers: authHeaders(token) };
  const res = http.get(
    `${REST_URL}/factory_code_records?select=*&limit=50&order=created_at.desc`,
    params
  );
  check(res, { 'getFactoryCodeRecords: status 200': (r) => r.status === 200 });
  return res.status === 200 ? res.json() : [];
}
