import { NextRequest, NextResponse } from 'next/server'
import { MOCK_MISSIONS } from '@/lib/mock-data'
import { getMissionStatus } from '@/types'

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') as 'active' | 'upcoming' | 'past' | null
  const missions = status
    ? MOCK_MISSIONS.filter((m) => getMissionStatus(m) === status)
    : MOCK_MISSIONS
  return NextResponse.json({ data: missions })
}
