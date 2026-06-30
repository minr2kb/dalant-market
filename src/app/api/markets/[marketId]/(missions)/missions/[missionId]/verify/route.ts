import { authRoute, ok, err } from '@/lib/api/route-helpers'
import { verifyMissionQR } from '@/lib/qr-server'

export const POST = authRoute<{ marketId: string; missionId: string }>(
  async (req, { supabase, params, userId: verifiedBy }) => {
    const body = (await req.json()) as { token?: string; userId?: string; slot?: number; photoUrls?: string[] }
    const { marketId, missionId } = params

    if (!body.token && !body.userId) return err('token or userId required', 400)

    const [{ data: mission, error: e1 }, { data: verifier }, { data: verifierParticipant }] =
      await Promise.all([
        supabase.from('missions').select('*').eq('id', missionId).single(),
        supabase.from('users').select('real_name').eq('id', verifiedBy).maybeSingle(),
        supabase.from('market_participants').select('role').eq('market_id', marketId).eq('user_id', verifiedBy).maybeSingle(),
      ])

    if (e1 || !mission) return err('Mission not found', 404)

    const verifierRole = (verifierParticipant as { role?: string } | null)?.role

    let targetUserId: string
    if (body.token) {
      const parsed = verifyMissionQR(body.token)
      if (!parsed) return err('Invalid or expired QR', 400)
      if (parsed.marketId !== marketId || parsed.missionId !== missionId) return err('QR mismatch', 400)
      targetUserId = parsed.userId
    } else {
      if (verifierRole !== 'admin') return err('Token required', 400)
      targetUserId = body.userId!
    }

    if (targetUserId === verifiedBy && verifierRole !== 'admin') return err('Cannot verify own QR', 403)

    const { data: participant, error: e2 } = await supabase
      .from('market_participants')
      .select('balance')
      .eq('market_id', marketId)
      .eq('user_id', targetUserId)
      .single()

    if (e2 || !participant) return err('User not found', 404)

    const { data: existingLogs } = await supabase
      .from('mission_logs')
      .select('slot')
      .eq('mission_id', missionId)
      .eq('user_id', targetUserId)

    const usedSlots = new Set((existingLogs ?? []).map((l) => l.slot as number))
    if (mission.limit_count !== null && usedSlots.size >= mission.limit_count)
      return err('All slots already completed', 422)

    const slotNum =
      body.slot ??
      (() => {
        if (mission.limit_count === null) {
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
      p_user_id: targetUserId,
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
        .eq('user_id', targetUserId)
        .eq('slot', slotNum)
    }

    return ok({
      missionId,
      userId: targetUserId,
      verifiedBy,
      slot: slotNum,
      reward: mission.reward,
      verifiedAt,
    })
  },
)
