import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getQueryClient } from '@/lib/query/get-query-client'
import { participantsQuery, missionsQuery } from '@/lib/query/queries'
import { getParticipant } from '@/lib/data/participants'
import { listMissions } from '@/lib/data/missions'
import { AdminUserDetailClient } from './AdminUserDetailClient'

export default async function AdminUserDetailPage(
  props: PageProps<'/markets/[id]/admin/users/[userId]'>,
) {
  const { id: marketId, userId } = await props.params
  const supabase = await createClient()
  const qc = getQueryClient()
  const [participantData, missions] = await Promise.all([
    getParticipant(supabase, marketId, userId),
    listMissions(supabase, marketId),
  ])
  qc.setQueryData(participantsQuery.get({ marketId, userId }).queryKey, { data: participantData })
  qc.setQueryData(missionsQuery.list({ marketId }).queryKey, { data: missions })
  return (
    <div>
      <div className="flex items-center gap-3 px-4 pt-14 pb-4 max-w-lg mx-auto">
        <Link href={`/markets/${marketId}/admin/users`} className="text-gray-400">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">유저 상세</h1>
      </div>
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense
          fallback={<p className="py-8 text-center text-sm text-gray-400">불러오는 중…</p>}
        >
          <AdminUserDetailClient marketId={marketId} userId={userId} />
        </Suspense>
      </HydrationBoundary>
    </div>
  )
}
