import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/server'
import { getQueryClient } from '@/lib/query/get-query-client'
import { marketsQuery, participantsQuery, missionsQuery, pointLogsQuery } from '@/lib/query/queries'
import { getMarket } from '@/lib/data/markets'
import { listParticipants } from '@/lib/data/participants'
import { listMissions } from '@/lib/data/missions'
import { listPointLogs } from '@/lib/data/point-logs'
import { AdminHomeClient } from './AdminHomeClient'

function Skeleton() {
  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-8 w-20 animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />)}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />)}
      </div>
    </div>
  )
}

export default async function AdminHomePage(props: PageProps<'/markets/[id]/admin/home'>) {
  const { id: marketId } = await props.params
  const supabase = await createClient()
  const qc = getQueryClient()
  const [market, participants, missions, pointLogs] = await Promise.all([
    getMarket(supabase, marketId),
    listParticipants(supabase, marketId),
    listMissions(supabase, marketId),
    listPointLogs(supabase, marketId),
  ])
  qc.setQueryData(marketsQuery.get({ marketId }).queryKey, { data: market })
  qc.setQueryData(participantsQuery.list({ marketId }).queryKey, { data: participants })
  qc.setQueryData(missionsQuery.list({ marketId }).queryKey, { data: missions })
  qc.setQueryData(pointLogsQuery.list({ marketId }).queryKey, { data: pointLogs })
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<Skeleton />}>
        <AdminHomeClient marketId={marketId} />
      </Suspense>
    </HydrationBoundary>
  )
}
