import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/server'
import { getQueryClient } from '@/lib/query/get-query-client'
import { marketsQuery, participantsQuery } from '@/lib/query/queries'
import { getMarket } from '@/lib/data/markets'
import { getParticipant } from '@/lib/data/participants'
import { MyPageClient } from './MyPageClient'

function Skeleton() {
  return (
    <div className="px-4 space-y-6 max-w-lg mx-auto">
      <div className="h-7 w-28 animate-pulse rounded-lg bg-gray-100" />
      <div className="space-y-px rounded-2xl overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 animate-pulse bg-gray-100" />
        ))}
      </div>
      <div className="space-y-px rounded-2xl overflow-hidden">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse bg-gray-100" />
        ))}
      </div>
      <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
    </div>
  )
}

export default async function MyPage(props: PageProps<'/markets/[id]/mypage'>) {
  const { id: marketId } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const qc = getQueryClient()
  const [market, participantData] = await Promise.all([
    getMarket(supabase, marketId),
    getParticipant(supabase, marketId, user.id),
  ])
  qc.setQueryData(marketsQuery.get({ marketId }).queryKey, { data: market })
  qc.setQueryData(participantsQuery.get({ marketId, userId: user.id }).queryKey, { data: participantData })

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<Skeleton />}>
        <MyPageClient marketId={marketId} userId={user.id} />
      </Suspense>
    </HydrationBoundary>
  )
}
