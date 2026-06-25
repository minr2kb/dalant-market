import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json() as { code: string }
  if (body.code === '0000') return NextResponse.json({ data: { granted: true } })
  return NextResponse.json({ error: 'Invalid code' }, { status: 403 })
}
