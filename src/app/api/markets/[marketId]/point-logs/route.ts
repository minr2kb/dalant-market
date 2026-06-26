import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { mapPointLog } from '@/lib/db'

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await props.params
  const userId = req.nextUrl.searchParams.get('userId')

  let query = supabase
    .from('point_logs')
    .select('*')
    .eq('market_id', marketId)
    .order('created_at', { ascending: false })

  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: (data ?? []).map((r) => mapPointLog(r as Record<string, unknown>)) })
}
