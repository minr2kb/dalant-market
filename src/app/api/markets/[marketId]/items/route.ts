import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { mapItem } from '@/lib/db'

export async function GET(
  _req: Request,
  props: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await props.params
  const { data, error } = await supabase
    .from('market_items')
    .select('*')
    .eq('market_id', marketId)
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: (data ?? []).map(mapItem) })
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await props.params
  const body = (await req.json()) as { name: string; price: number }
  const { data, error } = await supabase
    .from('market_items')
    .insert({ market_id: marketId, name: body.name, price: body.price })
    .select()
    .single()
  if (error || !data) return NextResponse.json({ error: error?.message }, { status: 500 })
  return NextResponse.json({ data: mapItem(data) }, { status: 201 })
}
