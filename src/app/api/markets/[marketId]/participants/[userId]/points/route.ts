import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ marketId: string; userId: string }> },
) {
  const { marketId, userId } = await props.params
  const body = (await req.json()) as { amount: number; memo?: string }
  if (typeof body.amount !== 'number')
    return NextResponse.json({ error: 'amount required' }, { status: 400 })

  const { data: p, error: e1 } = await supabase
    .from('market_participants')
    .select('balance')
    .eq('market_id', marketId)
    .eq('user_id', userId)
    .single()

  if (e1 || !p) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newBalance = p.balance + body.amount

  const [{ error: e2 }, { error: e3 }] = await Promise.all([
    supabase
      .from('market_participants')
      .update({ balance: newBalance })
      .eq('market_id', marketId)
      .eq('user_id', userId),
    supabase.from('point_logs').insert({
      market_id: marketId,
      user_id: userId,
      amount: body.amount,
      reason_type: 'manual',
      memo: body.memo ?? null,
    }),
  ])

  if (e2 || e3) return NextResponse.json({ error: (e2 ?? e3)?.message }, { status: 500 })

  return NextResponse.json({
    data: { userId, amount: body.amount, newBalance, memo: body.memo ?? null },
  })
}
