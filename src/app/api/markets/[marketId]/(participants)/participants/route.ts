import { mapParticipant } from '@/lib/db'
import { route, authRoute, ok, err } from '@/lib/api/route-helpers'

export const GET = route<{ marketId: string }>(async (_req, { supabase, params }) => {
  const { data, error } = await supabase
    .from('market_participants')
    .select('*, user:users!user_id(*)')
    .eq('market_id', params.marketId)
    .order('real_name', { foreignTable: 'users' })
  if (error) return err(error.message)
  return ok((data ?? []).map(mapParticipant))
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
