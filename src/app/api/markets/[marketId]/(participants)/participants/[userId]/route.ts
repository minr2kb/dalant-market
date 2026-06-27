import { getParticipant } from '@/lib/data/participants'
import { route, ok, err } from '@/lib/api/route-helpers'

export const GET = route<{ marketId: string; userId: string }>(async (_req, { supabase, params }) => {
  try {
    return ok(await getParticipant(supabase, params.marketId, params.userId))
  } catch {
    return err('Not found', 404)
  }
})
