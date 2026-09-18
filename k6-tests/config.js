// SANAD k6 Load Test Configuration
// ==================================
// All secrets MUST be provided via environment variables.
// Never hardcode credentials in this file.

export const SUPABASE_URL = __ENV.SUPABASE_URL;
export const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_KEY = __ENV.SUPABASE_SERVICE_KEY;

// Test user credentials pattern: k6test{VU_ID padded to 2 digits}@sanad-load.test
export const TEST_EMAIL_PREFIX = __ENV.TEST_EMAIL_PREFIX || 'k6test';
export const TEST_EMAIL_DOMAIN = __ENV.TEST_EMAIL_DOMAIN || 'sanad-load.test';
export const TEST_PASSWORD = __ENV.TEST_PASSWORD;

// API endpoints
export const AUTH_URL = `${SUPABASE_URL}/auth/v1`;
export const REST_URL = `${SUPABASE_URL}/rest/v1`;

// Default headers for Supabase REST API
export function authHeaders(token) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

// Headers for unauthenticated signup
export function anonHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
}

// Performance thresholds
export const THRESHOLDS = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.01'],
  checks: ['rate>0.99'],
};

// Relaxed thresholds for smoke tests
export const SMOKE_THRESHOLDS = {
  http_req_duration: ['p(95)<1000', 'p(99)<2000'],
  http_req_failed: ['rate<0.05'],
  checks: ['rate>0.95'],
};

// Document types for random creation
export const DOCUMENT_TYPES = ['QUOT', 'PINV', 'TINV', 'CINV', 'PKL', 'DN', 'BL'];

// Work item statuses
export const STATUSES = ['planning', 'in_progress', 'completed', 'cancelled'];

// Material origins for random data
export const ORIGINS = ['Saudi Arabia', 'UAE', 'China', 'India', 'Germany', 'USA', 'Japan', 'Korea'];

// HS codes for random data
export const HS_CODES = ['3901.10', '3901.20', '3901.30', '3902.10', '3903.11', '3903.19'];
