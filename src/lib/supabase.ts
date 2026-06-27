import { createClient } from '@supabase/supabase-js'

// API routes (server-side) use service role key to bypass RLS.
// Client-side code uses the SSR clients in src/lib/supabase/client.ts and server.ts.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
