import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ marketId: string; missionId: string }> },
) {
  const { marketId, missionId } = await props.params
  const body = (await req.json()) as { userId: string; verifiedBy: string; slot?: number }

  if (body.userId === body.verifiedBy)
    return NextResponse.json({ error: 'Cannot verify own QR' }, { status: 403 })

  const [{ data: mission, error: e1 }, { data: participant, error: e2 }, { data: verifier }] =
    await Promise.all([
      supabase.from('missions').select('*').eq('id', missionId).single(),
      supabase
        .from('market_participants')
        .select('balance')
        .eq('market_id', marketId)
        .eq('user_id', body.userId)
        .single(),
      supabase.from('users').select('real_name').eq('id', body.verifiedBy).maybeSingle(),
    ])

  if (e1 || !mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
  if (e2 || !participant) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: existingLogs } = await supabase
    .from('mission_logs')
    .select('slot')
    .eq('mission_id', missionId)
    .eq('user_id', body.userId)

  const usedSlots = new Set((existingLogs ?? []).map((l) => l.slot as number))
  if (mission.limit_count !== null && usedSlots.size >= mission.limit_count)
    return NextResponse.json({ error: 'All slots already completed' }, { status: 422 })

  const slotNum =
    body.slot ??
    Array.from({ length: mission.limit_count ?? 99 }, (_, i) => i + 1).find(
      (s) => !usedSlots.has(s),
    ) ??
    1

  const verifiedAt = new Date().toISOString()
  const verifierName = (verifier as { real_name?: string } | null)?.real_name ?? body.verifiedBy
  const newBalance = participant.balance + mission.reward

  const { data: missionLog, error: e3 } = await supabase
    .from('mission_logs')
    .insert({
      mission_id: missionId,
      user_id: body.userId,
      verified_by: body.verifiedBy,
      slot: slotNum,
      verified_by_name: verifierName,
      verified_at: verifiedAt,
    })
    .select()
    .single()

  if (e3 || !missionLog) return NextResponse.json({ error: e3?.message }, { status: 500 })

  await Promise.all([
    supabase
      .from('market_participants')
      .update({ balance: newBalance })
      .eq('market_id', marketId)
      .eq('user_id', body.userId),
    supabase.from('point_logs').insert({
      market_id: marketId,
      user_id: body.userId,
      amount: mission.reward,
      reason_type: 'mission',
      mission_log_id: (missionLog as { id: string }).id,
      mission_title: mission.title,
      verified_by_name: verifierName,
    }),
  ])

  return NextResponse.json({
    data: {
      missionId,
      userId: body.userId,
      verifiedBy: body.verifiedBy,
      slot: slotNum,
      reward: mission.reward,
      verifiedAt,
    },
  })
}
