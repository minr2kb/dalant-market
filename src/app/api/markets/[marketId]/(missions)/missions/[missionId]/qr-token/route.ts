import { authRoute, ok } from '@/lib/api/route-helpers'
import { signMissionQR } from '@/lib/qr-server'

export const GET = authRoute<{ marketId: string; missionId: string }>(
  async (_req, { params, userId }) => {
    return ok({ token: signMissionQR(params.marketId, params.missionId, userId) })
  },
)
