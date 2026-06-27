import { mapMarket } from '@/lib/db'
import { route, ok, err } from '@/lib/api/route-helpers'

export const GET = route<{ marketId: string }>(async (_req, { supabase, params }) => {
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .eq('id', params.marketId)
    .single()
  if (error || !data) return err('Not found', 404)
  return ok(mapMarket(data))
})
