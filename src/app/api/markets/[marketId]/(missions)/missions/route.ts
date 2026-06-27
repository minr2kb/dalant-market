import { listMissions } from '@/lib/data/missions'
import { mapMission } from '@/lib/db'
import type { MissionType } from '@/types'
import { route, ok, err } from '@/lib/api/route-helpers'

export const GET = route<{ marketId: string }>(async (req, { supabase, params }) => {
  const status = req.nextUrl.searchParams.get('status') as 'active' | 'upcoming' | 'past' | null
  const userId = req.nextUrl.searchParams.get('userId') ?? undefined
  try {
    return ok(await listMissions(supabase, params.marketId, { userId, status: status ?? undefined }))
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Error')
  }
})

export const POST = route<{ marketId: string }>(async (req, { supabase, params }) => {
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
