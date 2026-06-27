'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { MissionList } from '@/components/MissionList'
import { missionsQuery } from '@/lib/query/queries'

export function MissionListClient({ marketId }: { marketId: string }) {
  const { data } = useSuspenseQuery(missionsQuery.list({ marketId }))
  console.log(data)
  return <MissionList missions={data.data} marketId={marketId} />
}
