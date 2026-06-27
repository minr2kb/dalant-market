import { Suspense } from 'react'
import { MissionDetailClient } from './MissionDetailClient'

function Skeleton() {
  return (
    <div>
      <div className="flex items-center gap-3 px-4 pt-14 pb-4 max-w-lg mx-auto">
        <div className="h-6 w-6 animate-pulse rounded bg-gray-100" />
        <div className="h-6 w-40 animate-pulse rounded-lg bg-gray-100" />
      </div>
      <div className="px-4 max-w-lg mx-auto space-y-6">
        <div className="h-20 animate-pulse rounded-2xl bg-gray-100" />
        <div className="space-y-3">
          <div className="h-12 animate-pulse rounded-full bg-gray-100" />
          <div className="h-12 animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>
    </div>
  )
}

import { getCurrentUserId } from '@/lib/auth'

export default async function MissionDetailPage(
  props: PageProps<'/markets/[id]/missions/[missionId]'>,
) {
  const { id: marketId, missionId } = await props.params
  const userId = await getCurrentUserId()
  if (!userId) return null

  return (
    <Suspense fallback={<Skeleton />}>
      <MissionDetailClient marketId={marketId} missionId={missionId} userId={userId} />
    </Suspense>
  )
}
