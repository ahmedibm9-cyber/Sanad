/**
 * SANAD R2 Proxy Edge Function
 *
 * Server-side only. R2 credentials never reach the browser.
 * All file operations go through this function.
 *
 * Operations:
 *   POST /upload     — Upload file to R2
 *   POST /download   — Get presigned download URL
 *   POST /delete     — Delete file from R2
 *
 * Authorization:
 *   - Validates Supabase JWT
 *   - Verifies user has active membership for the companyId
 *   - Validates object key belongs to the company (companies/<companyId>/...)
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "npm:@aws-sdk/client-s3@3.744.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.744.0";

// ─── R2 Configuration ──────────────────────────────────
const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT") || "";
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") || "";
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") || "";
const R2_BUCKET = Deno.env.get("R2_BUCKET") || "sanad-production";

// ─── Supabase Configuration ──────────────────────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_URL_TTL_SECONDS = 900;
const MAX_BASE64_LENGTH = Math.ceil(MAX_UPLOAD_BYTES * 4 / 3);
const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
]);

function getS3Client(): S3Client {
  return new S3Client({
    endpoint: R2_ENDPOINT,
    region: "auto",
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

// ─── Auth Helpers ──────────────────────────────────────

interface AuthContext {
  userId: string;
  companyId: string;
}

async function verifyAuth(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.slice(7);

  // Verify JWT with Supabase
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: Deno.env.get("SUPABASE_ANON_KEY") || "",
    },
  });

  if (!userRes.ok) {
    throw new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userData = await userRes.json();
  const userId = userData.id;

  const accountRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&active=eq.true&select=id`,
    { headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY } }
  );
  if (!(await accountRes.json())?.length) {
    throw new Response(JSON.stringify({ error: "Account disabled" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get companyId from request body or query
  const url = new URL(req.url);
  let companyId: string | null = null;

  if (req.method === "POST") {
    try {
      const body = await req.clone().json();
      companyId = body.companyId || null;
    } catch {
      // Will be null
    }
  }

  if (!companyId) {
    companyId = url.searchParams.get("companyId");
  }

  if (!companyId) {
    throw new Response(JSON.stringify({ error: "companyId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify membership
  const memberRes = await fetch(
    `${SUPABASE_URL}/rest/v1/company_memberships?user_id=eq.${userId}&company_id=eq.${companyId}&active=eq.true&select=id`,
    {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
    }
  );

  const members = await memberRes.json();
  if (!members || members.length === 0) {
    throw new Response(JSON.stringify({ error: "Not a member of this company" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return { userId, companyId };
}

async function requirePermission(auth: AuthContext, permission: string): Promise<void> {
  const permissionRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_user_permission`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_user_id: auth.userId,
      p_company_id: auth.companyId,
      p_permission_key: permission,
    }),
  });

  if (!permissionRes.ok || await permissionRes.json() !== true) {
    throw new Response(JSON.stringify({ error: "Permission denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ─── Key Validation ──────────────────────────────────────

function validateKeyOwnership(key: string, companyId: string): void {
  const prefix = `companies/${companyId}/`;
  if (!key.startsWith(prefix)) {
    throw new Response(
      JSON.stringify({ error: "Access denied: key does not belong to this company" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
}

function decodeUpload(fileBase64: string): Uint8Array | null {
  if (fileBase64.length > MAX_BASE64_LENGTH) return null;

  try {
    return Uint8Array.from(atob(fileBase64), (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function sanitizeMetadata(metadata: unknown): Record<string, string> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};

  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key, value]) => key.length <= 64 && typeof value === "string" && value.length <= 512)
  );
}

// ─── CORS ──────────────────────────────────────────────

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigins = (Deno.env.get("CORS_ALLOWED_ORIGINS") || "").split(",").map(o => o.trim()).filter(Boolean);
  
  // If no origins configured, only allow same-origin requests
  const isAllowed = allowedOrigins.length === 0 
    ? false  // Deny all cross-origin when no origins configured
    : allowedOrigins.includes(origin);
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "none",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function jsonResponse(data: unknown, status = 200, req?: Request): Response {
  const corsHeaders = req ? getCorsHeaders(req) : {
    "Access-Control-Allow-Origin": "none",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Handlers ──────────────────────────────────────────

async function handleUpload(req: Request, auth: AuthContext): Promise<Response> {
  const body = await req.json();
  const { key, fileBase64, contentType, metadata } = body;

  if (typeof key !== "string" || typeof fileBase64 !== "string" || typeof contentType !== "string") {
    return jsonResponse({ error: "key, fileBase64, and contentType required" }, 400, req);
  }

  validateKeyOwnership(key, auth.companyId);
  await requirePermission(auth, "files.upload");

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return jsonResponse({ error: "Unsupported file type" }, 415, req);
  }

  const fileBytes = decodeUpload(fileBase64);
  if (!fileBytes || fileBytes.length === 0 || fileBytes.length > MAX_UPLOAD_BYTES) {
    return jsonResponse({ error: "File size must be between 1 byte and 25 MB" }, 413, req);
  }

  const s3 = getS3Client();

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: fileBytes,
      ContentType: contentType,
        Metadata: sanitizeMetadata(metadata),
    })
  );

  return jsonResponse({ key, size: fileBytes.length, contentType }, 200, req);
}

async function handleDownload(req: Request, auth: AuthContext): Promise<Response> {
  const body = await req.json();
  const { key, expiresIn = 3600 } = body;

  if (typeof key !== "string") {
    return jsonResponse({ error: "key required" }, 400, req);
  }

  validateKeyOwnership(key, auth.companyId);
  await requirePermission(auth, "files.download");

  const s3 = getS3Client();
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  const ttl = Math.min(Math.max(Number(expiresIn) || 60, 60), MAX_URL_TTL_SECONDS);
  const url = await getSignedUrl(s3, command, { expiresIn: ttl });

  return jsonResponse({ url, key, expiresIn: ttl }, 200, req);
}

async function handleDelete(req: Request, auth: AuthContext): Promise<Response> {
  const body = await req.json();
  const { key } = body;

  if (typeof key !== "string") {
    return jsonResponse({ error: "key required" }, 400, req);
  }

  validateKeyOwnership(key, auth.companyId);
  await requirePermission(auth, "files.delete");

  const s3 = getS3Client();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );

  return jsonResponse({ success: true }, 200, req);
}

// ─── Main Handler ──────────────────────────────────────

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  try {
    const auth = await verifyAuth(req);
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    switch (action) {
      case "upload":
        return await handleUpload(req, auth);
      case "download":
        return await handleDownload(req, auth);
      case "delete":
        return await handleDelete(req, auth);
      default:
        return jsonResponse({ error: "Unknown action" }, 400, req);
    }
  } catch (error) {
    // If it's already a Response (from verifyAuth), throw it
    if (error instanceof Response) {
      return error;
    }
    console.error("R2 proxy error:", error);
    return jsonResponse({ error: "Internal server error" }, 500, req);
  }
});
