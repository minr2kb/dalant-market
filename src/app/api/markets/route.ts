import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { mapMarket } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: (data ?? []).map(mapMarket) })
}
