import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/server'
import { getQueryClient } from '@/lib/query/get-query-client'
import { missionsQuery } from '@/lib/query/queries'
import { listMissions } from '@/lib/data/missions'
import { MissionListClient } from './MissionListClient'

export default async function MissionsPage(props: PageProps<'/markets/[id]/missions'>) {
  const { id: marketId } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id
  const qc = getQueryClient()
  const missions = await listMissions(supabase, marketId, { userId }).catch(() => [])
  qc.setQueryData(missionsQuery.list({ marketId, userId }).queryKey, { data: missions })

  return (
    <div className="px-4 pb-4 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">미션</h1>
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense
          fallback={
            <div className="space-y-3">
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-9 w-20 animate-pulse rounded-full bg-gray-100" />)}
              </div>
              {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />)}
            </div>
          }
        >
          <MissionListClient marketId={marketId} userId={userId ?? ''} />
        </Suspense>
      </HydrationBoundary>
    </div>
  )
}
