import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { mapParticipant, mapPointLog, mapOrder } from '@/lib/db'

export async function GET(
  _req: Request,
  props: { params: Promise<{ marketId: string; userId: string }> },
) {
  const { marketId, userId } = await props.params

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

  if (error || !p) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    data: {
      participant: mapParticipant(p),
      pointLogs: (logs ?? []).map(mapPointLog),
      orders: (orders ?? []).map(mapOrder),
    },
  })
}
