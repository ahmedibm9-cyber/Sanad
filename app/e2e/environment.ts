function env(name: string, fallback?: string): string {
  const value = process.env[name] || fallback
  if (!value) {
    throw new Error(`${name} is required for E2E tests. Set it as an env var or provide a default.`)
  }
  return value
}

export const e2eEnvironment = {
  stagingUrl: env('E2E_STAGING_URL', 'http://127.0.0.1:5173'),
  email: env('E2E_TEST_EMAIL', 'admin@sanad.com'),
  password: env('E2E_TEST_PASSWORD', 'admin123'),
  supabaseUrl: process.env['SUPABASE_URL'] || 'https://mvhawhcfzujkuyhkejty.supabase.co',
  supabaseAnonKey: process.env['SUPABASE_ANON_KEY'] || '',
}
