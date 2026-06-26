import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { mapMarket } from '@/lib/db'

export async function GET(
  _req: Request,
  props: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await props.params
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .eq('id', marketId)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: mapMarket(data) })
}
