import { listMissions } from '@/lib/data/missions'
import { mapMission } from '@/lib/db'
import type { MissionType } from '@/types'
import { route, marketAdminRoute, ok, err } from '@/lib/api/route-helpers'

export const GET = route<{ marketId: string }>(async (req, { supabase, params }) => {
  const status = req.nextUrl.searchParams.get('status') as 'active' | 'upcoming' | 'past' | null
  const userId = req.nextUrl.searchParams.get('userId') ?? undefined
  try {
    return ok(await listMissions(supabase, params.marketId, { userId, status: status ?? undefined }))
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Error')
  }
})

export const POST = marketAdminRoute<{ marketId: string }>(async (req, { supabase, params }) => {
  const body = (await req.json()) as {
    title: string
    description?: string
    type: MissionType
    isGroup: boolean
    reward: number
    limitCount: number | null
    activeFrom: string | null
    activeUntil: string | null
  }

  const VALID_TYPES = ['user_qr', 'upload', 'admin_qr', 'manual']
  if (!VALID_TYPES.includes(body.type)) return err('Invalid mission type', 400)
  if (!Number.isInteger(body.reward) || body.reward < 0) return err('reward must be a non-negative integer', 400)
  if (body.limitCount !== null && (!Number.isInteger(body.limitCount) || body.limitCount < 1)) return err('limitCount must be a positive integer', 400)

  const { data, error } = await supabase
    .from('missions')
    .insert({
      market_id: params.marketId,
      title: body.title,
      description: body.description ?? null,
      type: body.type,
      is_group: body.isGroup,
      reward: body.reward,
      limit_count: body.limitCount,
      active_from: body.activeFrom,
      active_until: body.activeUntil,
      is_active: true,
    })
    .select()
    .single()

  if (error || !data) return err(error?.message ?? 'Error')
  return ok(mapMission(data as Record<string, unknown>), 201)
})
