import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Create admin user
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@sanad.com',
    password: '123456789',
    email_confirm: true,
    user_metadata: {
      display_name: 'Admin',
      preferred_language: 'en',
      is_system_admin: true
    }
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ 
    user_id: data.user.id,
    email: data.user.email 
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
})
