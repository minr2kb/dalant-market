import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { mapMission } from '@/lib/db'

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await props.params
  const userId = req.nextUrl.searchParams.get('userId')

  const { data: mission, error } = await supabase
    .from('missions')
    .select('*')
    .eq('id', missionId)
    .single()

  if (error || !mission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let logs: Record<string, unknown>[] = []
  if (userId) {
    const { data } = await supabase
      .from('mission_logs')
      .select('*')
      .eq('mission_id', missionId)
      .eq('user_id', userId)
    logs = (data ?? []) as Record<string, unknown>[]
  }

  return NextResponse.json({ data: mapMission(mission as Record<string, unknown>, logs) })
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await props.params
  const body = await req.json()

  const update: Record<string, unknown> = {}
  if ('title' in body) update.title = body.title
  if ('description' in body) update.description = body.description
  if ('type' in body) update.type = body.type
  if ('isGroup' in body) update.is_group = body.isGroup
  if ('reward' in body) update.reward = body.reward
  if ('limitCount' in body) update.limit_count = body.limitCount
  if ('activeFrom' in body) update.active_from = body.activeFrom
  if ('activeUntil' in body) update.active_until = body.activeUntil
  if ('isActive' in body) update.is_active = body.isActive

  const { data, error } = await supabase
    .from('missions')
    .update(update)
    .eq('id', missionId)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 404 })
  return NextResponse.json({ data: mapMission(data as Record<string, unknown>) })
}

export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await props.params
  const { error } = await supabase.from('missions').delete().eq('id', missionId)
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data: { id: missionId } })
}
