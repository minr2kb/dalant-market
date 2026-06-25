import { NextResponse } from 'next/server'
import { MOCK_MARKET } from '@/lib/mock-data'

export function GET() {
  return NextResponse.json({ data: [MOCK_MARKET] })
}
