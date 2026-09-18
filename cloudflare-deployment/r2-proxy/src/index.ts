export interface Env {
  SANAD_R2_BUCKET: R2Bucket;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  CORS_ALLOWED_ORIGINS: string;
}

interface AuthContext {
  userId: string;
  companyId: string;
}

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil(MAX_UPLOAD_BYTES * 4 / 3);
const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/json",
  "image/jpeg",
  "image/png",
]);

function getCorsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigins = (env.CORS_ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
  const isAllowed = allowedOrigins.includes(origin)
    || /^https:\/\/[a-z0-9-]+\.sanad-etl\.pages\.dev$/i.test(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "none",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function jsonResponse(data: unknown, status: number, req: Request, env: Env): Response {
  const corsHeaders = getCorsHeaders(req, env);
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifyAuth(req: Request, env: Env): Promise<AuthContext & { accessToken: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.slice(7);

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
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
    `${env.SUPABASE_URL}/rest/v1/users?id=eq.${userId}&active=eq.true&select=id`,
    { headers: { Authorization: `Bearer ${token}`, apikey: env.SUPABASE_PUBLISHABLE_KEY } }
  );
  if (!(await accountRes.json())?.length) {
    throw new Response(JSON.stringify({ error: "Account disabled" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

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

  const memberRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/company_memberships?user_id=eq.${userId}&company_id=eq.${companyId}&active=eq.true&select=id`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.SUPABASE_PUBLISHABLE_KEY,
      },
    },
  );

  const members = await memberRes.json();
  if (!members || members.length === 0) {
    throw new Response(JSON.stringify({ error: "Not a member of this company" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return { userId, companyId, accessToken: token };
}

async function requirePermission(auth: AuthContext & { accessToken: string }, permission: string, env: Env): Promise<void> {
  const permissionRes = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/check_user_permission`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
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

function isBackupKey(key: string, companyId: string): boolean {
  return key.startsWith(`backups/${companyId}/`);
}

function validateKeyOwnership(key: string, companyId: string): void {
  if (!key.startsWith(`companies/${companyId}/`) && !isBackupKey(key, companyId)) {
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

async function handleUpload(req: Request, auth: AuthContext & { accessToken: string }, env: Env): Promise<Response> {
  const body = await req.json();
  const { key, fileBase64, contentType, metadata } = body;

  if (typeof key !== "string" || typeof fileBase64 !== "string" || typeof contentType !== "string") {
    return jsonResponse({ error: "key, fileBase64, and contentType required" }, 400, req, env);
  }

  validateKeyOwnership(key, auth.companyId);
  await requirePermission(auth, isBackupKey(key, auth.companyId) ? "backup.create" : "files.upload", env);

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return jsonResponse({ error: "Unsupported file type" }, 415, req, env);
  }

  const fileBytes = decodeUpload(fileBase64);
  if (!fileBytes || fileBytes.length === 0 || fileBytes.length > MAX_UPLOAD_BYTES) {
    return jsonResponse({ error: "File size must be between 1 byte and 25 MB" }, 413, req, env);
  }

  await env.SANAD_R2_BUCKET.put(key, fileBytes, {
    httpMetadata: { contentType },
    metadata: sanitizeMetadata(metadata),
  });

  return jsonResponse({ key, size: fileBytes.length, contentType }, 200, req, env);
}

async function handleDownload(req: Request, auth: AuthContext & { accessToken: string }, env: Env): Promise<Response> {
  const body = await req.json();
  const { key } = body;

  if (typeof key !== "string") {
    return jsonResponse({ error: "key required" }, 400, req, env);
  }

  validateKeyOwnership(key, auth.companyId);
  await requirePermission(auth, isBackupKey(key, auth.companyId) ? "backup.restore" : "files.download", env);

  const object = await env.SANAD_R2_BUCKET.get(key);
  if (!object) {
    return jsonResponse({ error: "Object not found" }, 404, req, env);
  }

  return new Response(object.body, {
    headers: {
      ...getCorsHeaders(req, env),
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "Content-Length": object.size.toString(),
    },
  });
}

async function handleDelete(req: Request, auth: AuthContext & { accessToken: string }, env: Env): Promise<Response> {
  const body = await req.json();
  const { key } = body;

  if (typeof key !== "string") {
    return jsonResponse({ error: "key required" }, 400, req, env);
  }

  validateKeyOwnership(key, auth.companyId);
  await requirePermission(auth, isBackupKey(key, auth.companyId) ? "backup.create" : "files.delete", env);

  await env.SANAD_R2_BUCKET.delete(key);

  return jsonResponse({ success: true }, 200, req, env);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: getCorsHeaders(request, env) });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, request, env);
    }

    try {
      const auth = await verifyAuth(request, env);
      const url = new URL(request.url);
      const action = url.pathname.split("/").pop();

      switch (action) {
        case "upload":
          return await handleUpload(request, auth, env);
        case "download":
          return await handleDownload(request, auth, env);
        case "delete":
          return await handleDelete(request, auth, env);
        default:
          return jsonResponse({ error: "Unknown action" }, 400, request, env);
      }
    } catch (error) {
      if (error instanceof Response) {
        return new Response(error.body, {
          status: error.status,
          headers: { ...getCorsHeaders(request, env), ...Object.fromEntries(error.headers) },
        });
      }
      console.error("R2 proxy error:", error);
      return jsonResponse({ error: "Internal server error" }, 500, request, env);
    }
  },
};
