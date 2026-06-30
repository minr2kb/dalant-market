import { authRoute, ok, err } from '@/lib/api/route-helpers'

export const POST = authRoute<{ marketId: string; missionId: string }>(
  async (req, { supabase, params, userId: verifiedBy }) => {
    const body = (await req.json()) as { userId: string; slot?: number; photoUrls?: string[] }
    const { marketId, missionId } = params

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

    if (body.userId === verifiedBy && mission.type === 'user_qr')
      return err('Cannot verify own QR', 403)

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
      (() => {
        if (mission.limit_count === null) {
          // unlimited: next available = max used slot + 1
          const maxUsed = usedSlots.size > 0 ? Math.max(...usedSlots) : 0
          return maxUsed + 1
        }
        return (
          Array.from({ length: mission.limit_count }, (_, i) => i + 1).find(
            (s) => !usedSlots.has(s),
          ) ?? 1
        )
      })()

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

    if (body.photoUrls && body.photoUrls.length > 0) {
      await supabase
        .from('mission_logs')
        .update({ photo_url: body.photoUrls.join(',') })
        .eq('mission_id', missionId)
        .eq('user_id', body.userId)
        .eq('slot', slotNum)
    }

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
