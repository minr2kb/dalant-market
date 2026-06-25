import { NextRequest, NextResponse } from 'next/server'
import { MOCK_MARKET, MOCK_ORDERS, MOCK_PARTICIPANTS } from '@/lib/mock-data'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const orders = userId ? MOCK_ORDERS.filter((o) => o.userId === userId) : MOCK_ORDERS
  return NextResponse.json({ data: orders })
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    userId: string
    verifiedBy: string
    items: Array<{ name: string; price: number; qty: number }>
  }

  const participant = MOCK_PARTICIPANTS.find((p) => p.user.id === body.userId)
  if (!participant) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const total = body.items.reduce((sum, i) => sum + i.price * i.qty, 0)
  if (participant.balance < total)
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 422 })

  return NextResponse.json({
    data: {
      id: `o_new`,
      marketId: MOCK_MARKET.id,
      userId: body.userId,
      verifiedBy: body.verifiedBy,
      items: body.items,
      total,
      newBalance: participant.balance - total,
      purchasedAt: new Date().toISOString(),
    },
  }, { status: 201 })
}
