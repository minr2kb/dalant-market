import { NextRequest, NextResponse } from 'next/server'
import { MOCK_MISSIONS } from '@/lib/mock-data'

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ missionId: string }> }
) {
  const { missionId } = await props.params
  const mission = MOCK_MISSIONS.find((m) => m.id === missionId)
  if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 })

  const body = await req.json() as { userId: string; verifiedBy: string; slot?: number }
  if (body.userId === body.verifiedBy)
    return NextResponse.json({ error: 'Cannot verify own QR' }, { status: 403 })

  return NextResponse.json({
    data: {
      missionId,
      userId: body.userId,
      verifiedBy: body.verifiedBy,
      slot: body.slot ?? 1,
      reward: mission.reward,
      verifiedAt: new Date().toISOString(),
    },
  })
}
