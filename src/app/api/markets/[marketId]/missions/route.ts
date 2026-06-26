import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { mapMission } from '@/lib/db'
import { getMissionStatus } from '@/types'
import type { MissionType } from '@/types'

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await props.params
  const status = req.nextUrl.searchParams.get('status') as 'active' | 'upcoming' | 'past' | null
  const userId = req.nextUrl.searchParams.get('userId')

  const { data: missions, error } = await supabase
    .from('missions')
    .select('*')
    .eq('market_id', marketId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let logs: Record<string, unknown>[] = []
  if (userId && missions && missions.length > 0) {
    const { data } = await supabase
      .from('mission_logs')
      .select('*')
      .in('mission_id', missions.map((m) => m.id))
      .eq('user_id', userId)
    logs = (data ?? []) as Record<string, unknown>[]
  }

  let result = (missions ?? []).map((m) => mapMission(m as Record<string, unknown>, logs))
  if (status) result = result.filter((m) => getMissionStatus(m) === status)

  return NextResponse.json({ data: result })
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await props.params
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
      market_id: marketId,
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

  if (error || !data) return NextResponse.json({ error: error?.message }, { status: 500 })
  return NextResponse.json({ data: mapMission(data as Record<string, unknown>) }, { status: 201 })
}
