import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/server'
import { getQueryClient } from '@/lib/query/get-query-client'
import { marketsQuery, participantsQuery } from '@/lib/query/queries'
import { getMarket } from '@/lib/data/markets'
import { getParticipant } from '@/lib/data/participants'
import { UserHomeClient } from './UserHomeClient'

function Skeleton() {
  return (
    <div className="px-4 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3.5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-7 w-32 animate-pulse rounded-lg bg-gray-100" />
        </div>
        <div className="h-8 w-16 animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="h-36 animate-pulse rounded-3xl bg-emerald-100" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-gray-100" />)}
      </div>
    </div>
  )
}

export default async function UserHomePage(props: PageProps<'/markets/[id]/home'>) {
  const { id: marketId } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  await supabase
    .from('market_participants')
    .upsert(
      { market_id: marketId, user_id: user.id, role: 'user', balance: 0 },
      { onConflict: 'market_id,user_id', ignoreDuplicates: true },
    )

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
        <UserHomeClient marketId={marketId} userId={user.id} />
      </Suspense>
    </HydrationBoundary>
  )
}
