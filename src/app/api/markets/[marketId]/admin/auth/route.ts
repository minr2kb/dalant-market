import { authRoute, ok, err } from '@/lib/api/route-helpers'

export const POST = authRoute<{ marketId: string }>(async (req, { supabase, params, userId }) => {
  const body = (await req.json()) as { code: string }

  const { data: market } = await supabase
    .from('markets')
    .select('admin_code')
    .eq('id', params.marketId)
    .single()

  if (!market || market.admin_code !== body.code) return err('Invalid code', 403)

  const { error } = await supabase
    .from('market_participants')
    .update({ role: 'admin' })
    .eq('market_id', params.marketId)
    .eq('user_id', userId)

  if (error) return err(error.message)
  return ok({ granted: true })
})
