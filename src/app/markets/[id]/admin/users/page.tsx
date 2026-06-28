import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/server'
import { getQueryClient } from '@/lib/query/get-query-client'
import { participantsQuery } from '@/lib/query/queries'
import { listParticipants } from '@/lib/data/participants'
import { AdminUsersClient } from './AdminUsersClient'

export default async function AdminUsersPage(props: PageProps<'/markets/[id]/admin/users'>) {
  const { id: marketId } = await props.params
  const supabase = await createClient()
  const qc = getQueryClient()
  const participants = await listParticipants(supabase, marketId)
  qc.setQueryData(participantsQuery.list({ marketId }).queryKey, { data: participants })
  return (
    <div className="px-4 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">유저 관리</h1>
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense
          fallback={
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />)}
            </div>
          }
        >
          <AdminUsersClient marketId={marketId} />
        </Suspense>
      </HydrationBoundary>
    </div>
  )
}
