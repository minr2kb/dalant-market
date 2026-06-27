import { mapParticipant, mapPointLog, mapOrder } from '@/lib/db'
import { route, ok, err } from '@/lib/api/route-helpers'

export const GET = route<{ marketId: string; userId: string }>(async (_req, { supabase, params }) => {
  const { marketId, userId } = params

  const [{ data: p, error }, { data: logs }, { data: orders }] = await Promise.all([
    supabase
      .from('market_participants')
      .select('*, user:users!user_id(*)')
      .eq('market_id', marketId)
      .eq('user_id', userId)
      .single(),
    supabase
      .from('point_logs')
      .select('*')
      .eq('market_id', marketId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('*')
      .eq('market_id', marketId)
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false }),
  ])

  if (error || !p) return err('Not found', 404)

  return ok({
    participant: mapParticipant(p),
    pointLogs: (logs ?? []).map(mapPointLog),
    orders: (orders ?? []).map(mapOrder),
  })
})
