import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/server'
import { getQueryClient } from '@/lib/query/get-query-client'
import { marketsQuery, participantsQuery } from '@/lib/query/queries'
import { getMarket } from '@/lib/data/markets'
import { listParticipants } from '@/lib/data/participants'
import { RankingClient } from './RankingClient'

function Skeleton() {
  return (
    <div className="px-4 space-y-4 max-w-lg mx-auto">
      <div className="h-7 w-20 animate-pulse rounded-lg bg-gray-100" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  )
}

export default async function RankingPage(props: PageProps<'/markets/[id]/ranking'>) {
  const { id: marketId } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const qc = getQueryClient()
  const [market, participants] = await Promise.all([
    getMarket(supabase, marketId),
    listParticipants(supabase, marketId),
  ])
  qc.setQueryData(marketsQuery.get({ marketId }).queryKey, { data: market })
  qc.setQueryData(participantsQuery.list({ marketId }).queryKey, { data: participants })

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<Skeleton />}>
        <RankingClient marketId={marketId} userId={user.id} />
      </Suspense>
    </HydrationBoundary>
  )
}
