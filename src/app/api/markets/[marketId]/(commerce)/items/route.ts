import { mapItem } from '@/lib/db'
import { route, ok, err } from '@/lib/api/route-helpers'

export const GET = route<{ marketId: string }>(async (_req, { supabase, params }) => {
  const { data, error } = await supabase
    .from('market_items')
    .select('*')
    .eq('market_id', params.marketId)
    .order('name')
  if (error) return err(error.message)
  return ok((data ?? []).map(mapItem))
})

export const POST = route<{ marketId: string }>(async (req, { supabase, params }) => {
  const body = (await req.json()) as { name: string; price: number }
  const { data, error } = await supabase
    .from('market_items')
    .insert({ market_id: params.marketId, name: body.name, price: body.price })
    .select()
    .single()
  if (error || !data) return err(error?.message ?? 'Error')
  return ok(mapItem(data), 201)
})
