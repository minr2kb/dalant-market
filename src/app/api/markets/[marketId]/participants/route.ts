import { NextResponse } from 'next/server'
import { MOCK_PARTICIPANTS } from '@/lib/mock-data'

export async function GET() {
  return NextResponse.json({ data: MOCK_PARTICIPANTS })
}
