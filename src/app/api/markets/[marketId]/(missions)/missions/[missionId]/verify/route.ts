import { authRoute, ok, err } from '@/lib/api/route-helpers'

export const POST = authRoute<{ marketId: string; missionId: string }>(
  async (req, { supabase, params, userId: verifiedBy }) => {
    const body = (await req.json()) as { userId: string; slot?: number }
    const { marketId, missionId } = params

    if (body.userId === verifiedBy) return err('Cannot verify own QR', 403)

    const [{ data: mission, error: e1 }, { data: participant, error: e2 }, { data: verifier }] =
      await Promise.all([
        supabase.from('missions').select('*').eq('id', missionId).single(),
        supabase
          .from('market_participants')
          .select('balance')
          .eq('market_id', marketId)
          .eq('user_id', body.userId)
          .single(),
        supabase.from('users').select('real_name').eq('id', verifiedBy).maybeSingle(),
      ])

    if (e1 || !mission) return err('Mission not found', 404)
    if (e2 || !participant) return err('User not found', 404)

    // admin_qr / upload 미션은 관리자만 인증 가능
    if (mission.type === 'admin_qr' || mission.type === 'upload') {
      const { data: adminCheck } = await supabase
        .from('market_participants')
        .select('role')
        .eq('market_id', marketId)
        .eq('user_id', verifiedBy)
        .single()
      if (adminCheck?.role !== 'admin') return err('Forbidden', 403)
    }

    const { data: existingLogs } = await supabase
      .from('mission_logs')
      .select('slot')
      .eq('mission_id', missionId)
      .eq('user_id', body.userId)

    const usedSlots = new Set((existingLogs ?? []).map((l) => l.slot as number))
    if (mission.limit_count !== null && usedSlots.size >= mission.limit_count)
      return err('All slots already completed', 422)

    const slotNum =
      body.slot ??
      Array.from({ length: mission.limit_count ?? 99 }, (_, i) => i + 1).find(
        (s) => !usedSlots.has(s),
      ) ??
      1

    const verifiedAt = new Date().toISOString()
    const verifierName = (verifier as { real_name?: string } | null)?.real_name ?? verifiedBy

    const { error: e3 } = await supabase.rpc('award_mission', {
      p_market_id: marketId,
      p_mission_id: missionId,
      p_user_id: body.userId,
      p_verified_by: verifiedBy,
      p_slot: slotNum,
      p_verified_by_name: verifierName,
      p_verified_at: verifiedAt,
      p_reward: mission.reward,
      p_mission_title: mission.title,
    })

    if (e3) return err(e3.message)

    return ok({
      missionId,
      userId: body.userId,
      verifiedBy,
      slot: slotNum,
      reward: mission.reward,
      verifiedAt,
    })
  },
)
