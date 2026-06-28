'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { MissionList } from '@/components/MissionList'
import { missionsQuery } from '@/lib/query/queries'

export function MissionListClient({ marketId, userId }: { marketId: string; userId: string }) {
  const { data } = useSuspenseQuery(missionsQuery.list({ marketId, userId: userId || undefined }))
  return <MissionList missions={data.data.filter((m) => m.isActive)} marketId={marketId} />
}
