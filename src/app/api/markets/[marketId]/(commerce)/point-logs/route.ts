import { mapPointLog } from '@/lib/db'
import { route, ok, err } from '@/lib/api/route-helpers'

export const GET = route<{ marketId: string }>(async (req, { supabase, params }) => {
  const userId = req.nextUrl.searchParams.get('userId')

  let query = supabase
    .from('point_logs')
    .select('*')
    .eq('market_id', params.marketId)
    .order('created_at', { ascending: false })

  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) return err(error.message)
  return ok((data ?? []).map((r) => mapPointLog(r as Record<string, unknown>)))
})
