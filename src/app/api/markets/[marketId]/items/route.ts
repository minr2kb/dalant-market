import { NextResponse } from 'next/server'
import { MOCK_MARKET_ITEMS } from '@/lib/mock-data'

export async function GET() {
  return NextResponse.json({ data: MOCK_MARKET_ITEMS })
}
