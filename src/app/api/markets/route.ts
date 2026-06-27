import { mapMarket } from '@/lib/db'
import { route, ok, err } from '@/lib/api/route-helpers'

export const dynamic = 'force-dynamic'

export const GET = route(async (_req, { supabase }) => {
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return err(error.message)
  return ok((data ?? []).map(mapMarket))
})
