import { NextRequest, NextResponse } from 'next/server'
import { MOCK_POINT_LOGS } from '@/lib/mock-data'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const logs = userId ? MOCK_POINT_LOGS.filter((l) => l.userId === userId) : MOCK_POINT_LOGS
  return NextResponse.json({ data: logs })
}
