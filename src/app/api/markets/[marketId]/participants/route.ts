import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { mapParticipant } from '@/lib/db'

export async function GET(
  _req: Request,
  props: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await props.params
  const { data, error } = await supabase
    .from('market_participants')
    .select('*, user:users!user_id(*)')
    .eq('market_id', marketId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: (data ?? []).map(mapParticipant) })
}
