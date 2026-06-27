import { listParticipants } from '@/lib/data/participants'
import { route, authRoute, ok, err } from '@/lib/api/route-helpers'

export const GET = route<{ marketId: string }>(async (_req, { supabase, params }) => {
  try {
    return ok(await listParticipants(supabase, params.marketId))
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Error')
  }
})

export const POST = authRoute<{ marketId: string }>(async (_req, { supabase, params, userId }) => {
  const { error } = await supabase
    .from('market_participants')
    .upsert(
      { market_id: params.marketId, user_id: userId, role: 'user', balance: 0 },
      { onConflict: 'market_id,user_id', ignoreDuplicates: true },
    )
  if (error) return err(error.message)
  return ok({ ok: true })
})
