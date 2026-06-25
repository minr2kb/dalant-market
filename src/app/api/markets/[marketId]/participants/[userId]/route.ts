import { NextResponse } from 'next/server'
import { MOCK_PARTICIPANTS, MOCK_POINT_LOGS, MOCK_ORDERS } from '@/lib/mock-data'

export async function GET(
  _req: Request,
  props: { params: Promise<{ userId: string }> }
) {
  const { userId } = await props.params
  const participant = MOCK_PARTICIPANTS.find((p) => p.user.id === userId)
  if (!participant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    data: {
      participant,
      pointLogs: MOCK_POINT_LOGS.filter((l) => l.userId === userId),
      orders: MOCK_ORDERS.filter((o) => o.userId === userId),
    },
  })
}
