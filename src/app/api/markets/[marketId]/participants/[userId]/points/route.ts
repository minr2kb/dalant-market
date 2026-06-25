import { NextRequest, NextResponse } from 'next/server'
import { MOCK_PARTICIPANTS } from '@/lib/mock-data'

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ userId: string }> }
) {
  const { userId } = await props.params
  const participant = MOCK_PARTICIPANTS.find((p) => p.user.id === userId)
  if (!participant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json() as { amount: number; memo?: string }
  if (typeof body.amount !== 'number') return NextResponse.json({ error: 'amount required' }, { status: 400 })

  return NextResponse.json({
    data: {
      userId,
      amount: body.amount,
      newBalance: participant.balance + body.amount,
      memo: body.memo ?? null,
    },
  })
}
