import { createClient } from '@supabase/supabase-js'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const baseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function getHeaders(request: Request) {
  const origin = request.headers.get('Origin') || ''
  const allowed = ['https://sanad-etl.pages.dev', 'http://localhost:5173', 'http://127.0.0.1:5173']
  return { ...baseHeaders, 'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : 'none' }
}

function response(body: unknown, status: number, request: Request) {
  return new Response(JSON.stringify(body), { status, headers: getHeaders(request) })
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: getHeaders(request) })
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405, request)

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return response({ error: 'Authentication required' }, 401, request)

  const { data: caller, error: callerError } = await admin.auth.getUser(authorization.slice(7))
  if (callerError || !caller.user) return response({ error: 'Invalid session' }, 401, request)

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const displayName = typeof body?.displayName === 'string' ? body.displayName.trim() : ''
  const memberships = Array.isArray(body?.memberships) ? body.memberships : []

  if (!email || !displayName || memberships.length === 0) {
    return response({ error: 'email, displayName, and memberships are required' }, 400, request)
  }
  if (email.length > 320 || displayName.length > 160 || memberships.length > 50) {
    return response({ error: 'Invalid user data' }, 400, request)
  }

  const companyIds = memberships.map((membership: any) => membership.companyId)
  if (!companyIds.every(isUuid) || new Set(companyIds).size !== companyIds.length) {
    return response({ error: 'Invalid company membership data' }, 400, request)
  }

  const { data: callerProfile } = await admin
    .from('users')
    .select('is_system_admin, active')
    .eq('id', caller.user.id)
    .maybeSingle()

  if (!callerProfile?.active) return response({ error: 'Account disabled' }, 403, request)

  if (!callerProfile.is_system_admin) {
    const { data: adminMemberships, error: membershipError } = await admin
      .from('company_memberships')
      .select('company_id')
      .eq('user_id', caller.user.id)
      .eq('base_role', 'admin')
      .eq('active', true)
      .in('company_id', companyIds)

    if (membershipError || new Set((adminMemberships || []).map(row => row.company_id)).size !== companyIds.length) {
      return response({ error: 'You must be an administrator of every selected company' }, 403, request)
    }
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { display_name: displayName },
  })
  if (inviteError || !invited.user) {
    return response({ error: inviteError?.message || 'Unable to invite user' }, 400, request)
  }

  const rows = memberships.map((membership: any) => ({
    company_id: membership.companyId,
    user_id: invited.user!.id,
    base_role: ['admin', 'user', 'viewer'].includes(membership.role) ? membership.role : 'user',
  }))
  const { data: createdMemberships, error: insertError } = await admin
    .from('company_memberships')
    .insert(rows)
    .select('id, company_id')

  if (insertError || !createdMemberships) {
    await admin.auth.admin.deleteUser(invited.user.id)
    return response({ error: 'Unable to create company memberships' }, 500, request)
  }

  const permissionRows = memberships.flatMap((membership: any, index: number) => {
    const created = createdMemberships[index]
    const permissions = Array.isArray(membership.permissions) ? membership.permissions : []
    return permissions.map((permissionKey: unknown) => ({
      membership_id: created.id,
      permission_key: typeof permissionKey === 'string' ? permissionKey : '',
      allowed: true,
    })).filter((row: any) => row.permission_key)
  })
  if (permissionRows.length > 0) {
    const { error: permissionError } = await admin.from('membership_permissions').insert(permissionRows)
    if (permissionError) {
      await admin.from('company_memberships').delete().eq('user_id', invited.user.id)
      await admin.auth.admin.deleteUser(invited.user.id)
      return response({ error: 'Unable to create user permissions' }, 500, request)
    }
  }

  return response({ userId: invited.user.id, email, memberships: createdMemberships.length }, 200, request)
})
