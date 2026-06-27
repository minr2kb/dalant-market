import { getMarket } from '@/lib/data/markets'
import { route, ok, err } from '@/lib/api/route-helpers'

export const GET = route<{ marketId: string }>(async (_req, { supabase, params }) => {
  try {
    return ok(await getMarket(supabase, params.marketId))
  } catch {
    return err('Not found', 404)
  }
})
