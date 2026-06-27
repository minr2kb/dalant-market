import { listPointLogs } from '@/lib/data/point-logs'
import { route, ok, err } from '@/lib/api/route-helpers'

export const GET = route<{ marketId: string }>(async (req, { supabase, params }) => {
  const userId = req.nextUrl.searchParams.get('userId') ?? undefined
  try {
    return ok(await listPointLogs(supabase, params.marketId, { userId }))
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Error')
  }
})
