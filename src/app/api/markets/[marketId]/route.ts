import { NextResponse } from 'next/server'
import { MOCK_MARKET } from '@/lib/mock-data'

export async function GET(
  _req: Request,
  props: { params: Promise<{ marketId: string }> }
) {
  const { marketId } = await props.params
  if (marketId !== MOCK_MARKET.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: MOCK_MARKET })
}
