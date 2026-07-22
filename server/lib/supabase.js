import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'

const serverAuthOptions = {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
}

export function createSupabaseAuthClient() {
  return createClient(env.supabaseUrl, env.supabasePublishableKey, serverAuthOptions)
}

export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseSecretKey,
  serverAuthOptions,
)