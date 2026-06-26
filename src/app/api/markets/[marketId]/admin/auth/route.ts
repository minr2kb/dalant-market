import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await props.params
  const body = (await req.json()) as { code: string; userId: string }

  const { data: market } = await supabase
    .from('markets')
    .select('admin_code')
    .eq('id', marketId)
    .single()

  if (!market || market.admin_code !== body.code)
    return NextResponse.json({ error: 'Invalid code' }, { status: 403 })

  const { error } = await supabase
    .from('market_participants')
    .update({ role: 'admin' })
    .eq('market_id', marketId)
    .eq('user_id', body.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: { granted: true } })
}
