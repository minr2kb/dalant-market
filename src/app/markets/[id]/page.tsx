import { Calendar, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { mapMarket } from '@/lib/db'
import { JoinButton } from './JoinButton'

export default async function MarketJoinPage(props: PageProps<'/markets/[id]'>) {
  const { id } = await props.params
  const supabase = await createClient()

  const { data: marketRow } = await supabase
    .from('markets')
    .select('*')
    .eq('id', id)
    .single()

  const { count } = await supabase
    .from('market_participants')
    .select('*', { count: 'exact', head: true })
    .eq('market_id', id)

  if (!marketRow) return null
  const market = mapMarket(marketRow)

  const startDate = new Date(market.startsAt).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })
  const endDate = new Date(market.endsAt).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-white dark:bg-gray-900 px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500">
            <span className="text-2xl font-bold text-white">D</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{market.title}</h1>
          {market.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{market.description}</p>
          )}
        </div>

        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <span>{startDate} ~ {endDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Users className="h-4 w-4 text-emerald-500" />
            <span>현재 {count ?? 0}명 참여 중</span>
          </div>
        </div>

        <JoinButton marketId={id} />
      </div>
    </div>
  )
}
