'use client'

import { useMemo } from 'react'
import { useSuspenseQueries } from '@tanstack/react-query'
import { keyBy } from 'es-toolkit'
import { PointLogItem } from '@/components/PointLogItem'
import { marketsQuery, participantsQuery } from '@/lib/query/queries'
export function HistoryClient({ marketId, userId }: { marketId: string; userId: string }) {
  const [{ data: marketData }, { data: participantData }] = useSuspenseQueries({
    queries: [
      marketsQuery.get({ marketId }),
      participantsQuery.get({ marketId, userId }),
    ],
  })

  const market = marketData.data
  const { participant: user, pointLogs: logs, orders } = participantData.data
  const orderMap = useMemo(
    () => keyBy(orders, (o) => o.id),
    [orders],
  )

  return (
    <div className="px-4 max-w-lg mx-auto space-y-5">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-gray-900">{market.pointLabel} 내역</h1>
        <span className="text-sm text-gray-500">
          잔액{' '}
          <span className="font-bold text-emerald-500">
            {user.balance} {market.pointLabel}
          </span>
        </span>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <PointLogItem
            key={log.id}
            log={log}
            order={log.orderId ? orderMap[log.orderId] : undefined}
            pointLabel={market.pointLabel}
          />
        ))}
        {logs.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">아직 내역이 없어요</p>
        )}
      </div>
    </div>
  )
}
