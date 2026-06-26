import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { mapOrder } from '@/lib/db'

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await props.params
  const userId = req.nextUrl.searchParams.get('userId')

  let query = supabase
    .from('orders')
    .select('*')
    .eq('market_id', marketId)
    .order('purchased_at', { ascending: false })
  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: (data ?? []).map((r) => mapOrder(r as Record<string, unknown>)) })
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await props.params
  const body = (await req.json()) as {
    userId: string
    verifiedBy: string
    items: Array<{ name: string; price: number; qty: number }>
  }

  const { data: participant, error: e1 } = await supabase
    .from('market_participants')
    .select('balance')
    .eq('market_id', marketId)
    .eq('user_id', body.userId)
    .single()

  if (e1 || !participant) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const total = body.items.reduce((sum, i) => sum + i.price * i.qty, 0)
  if (participant.balance < total)
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 422 })

  const { data: verifier } = await supabase
    .from('users')
    .select('real_name')
    .eq('id', body.verifiedBy)
    .maybeSingle()

  const verifierName = (verifier as { real_name?: string } | null)?.real_name ?? body.verifiedBy
  const newBalance = participant.balance - total

  const { data: order, error: e2 } = await supabase
    .from('orders')
    .insert({
      market_id: marketId,
      user_id: body.userId,
      verified_by: body.verifiedBy,
      verified_by_name: verifierName,
      items: body.items,
      total,
    })
    .select()
    .single()

  if (e2 || !order) return NextResponse.json({ error: e2?.message }, { status: 500 })

  const itemName =
    body.items.length === 1
      ? body.items[0].name
      : `${body.items[0].name} 외 ${body.items.length - 1}건`

  await Promise.all([
    supabase
      .from('market_participants')
      .update({ balance: newBalance })
      .eq('market_id', marketId)
      .eq('user_id', body.userId),
    supabase.from('point_logs').insert({
      market_id: marketId,
      user_id: body.userId,
      amount: -total,
      reason_type: 'purchase',
      order_id: (order as { id: string }).id,
      item_name: itemName,
    }),
  ])

  return NextResponse.json(
    { data: { ...mapOrder(order as Record<string, unknown>), newBalance } },
    { status: 201 },
  )
}
