import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await props.params
  const idx = store.items.findIndex((i) => i.id === itemId)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  store.items.splice(idx, 1)
  return NextResponse.json({ data: { id: itemId } })
}
