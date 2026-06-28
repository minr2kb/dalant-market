import { authRoute, ok, err } from '@/lib/api/route-helpers'

export const PATCH = authRoute<{ marketId: string; userId: string }>(async (req, { supabase, params }) => {
  const body = (await req.json()) as { amount: number; memo?: string }
  if (typeof body.amount !== 'number') return err('amount required', 400)

  const { marketId, userId } = params

  const { data: p, error: e1 } = await supabase
    .from('market_participants')
    .select('balance')
    .eq('market_id', marketId)
    .eq('user_id', userId)
    .single()

  if (e1 || !p) return err('Not found', 404)

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

  if (e2 || e3) return err((e2 ?? e3)?.message ?? 'Error')

  return ok({ userId, amount: body.amount, newBalance, memo: body.memo ?? null })
})
