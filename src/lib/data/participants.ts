import type { SupabaseClient } from '@supabase/supabase-js'
import { mapParticipant, mapPointLog, mapOrder } from '@/lib/db'

export async function listParticipants(supabase: SupabaseClient, marketId: string) {
  const { data, error } = await supabase
    .from('market_participants')
    .select('*, user:users!user_id(*)')
    .eq('market_id', marketId)
    .order('real_name', { foreignTable: 'users' })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapParticipant)
}

export async function getParticipant(
  supabase: SupabaseClient,
  marketId: string,
  userId: string,
) {
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
  if (error || !p) throw new Error('Not found')
  return {
    participant: mapParticipant(p),
    pointLogs: (logs ?? []).map(mapPointLog),
    orders: (orders ?? []).map(mapOrder),
  }
}
