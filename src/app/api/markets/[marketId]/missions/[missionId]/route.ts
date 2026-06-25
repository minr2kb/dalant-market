import { NextResponse } from 'next/server'
import { MOCK_MISSIONS } from '@/lib/mock-data'

export async function GET(
  _req: Request,
  props: { params: Promise<{ missionId: string }> }
) {
  const { missionId } = await props.params
  const mission = MOCK_MISSIONS.find((m) => m.id === missionId)
  if (!mission) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: mission })
}
