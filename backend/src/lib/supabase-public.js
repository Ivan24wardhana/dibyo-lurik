import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase tanpa auth token.
 * Dipakai untuk operasi sebelum user punya session (login).
 */
const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default supabasePublic