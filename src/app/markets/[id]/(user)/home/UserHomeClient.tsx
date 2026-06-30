'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react'
import { useSuspenseQueries } from '@tanstack/react-query'
import { PayQRButton } from '@/components/PayQRButton'
import { TransferModal } from '@/components/TransferModal'
import { AdminAccessButton } from '@/components/AdminAccessButton'
import { HomeScanButton } from '@/components/HomeScanButton'
import { Button } from '@/components/ui/button'
import { marketsQuery, participantsQuery } from '@/lib/query/queries'
export function UserHomeClient({ marketId, userId }: { marketId: string; userId: string }) {
  const [transferOpen, setTransferOpen] = useState(false)
  const closeTransfer = useCallback(() => setTransferOpen(false), [])

  const [{ data: marketData }, { data: participantData }] = useSuspenseQueries({
    queries: [
      marketsQuery.get({ marketId }),
      participantsQuery.get({ marketId, userId }),
    ],
  })

  const market = marketData.data
  const { participant: user, pointLogs } = participantData.data
  const recentLogs = useMemo(() => pointLogs.slice(0, 3), [pointLogs])

  return (
    <div className="px-4 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">{market.title}</p>
          <h1 className="text-xl font-bold text-gray-900">{user.displayName}</h1>
        </div>
        <AdminAccessButton marketId={marketId} compact />
      </div>

      <div className="rounded-3xl bg-emerald-500 p-6 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium opacity-80">보유 {market.pointLabel}</p>
            <p className="text-4xl font-bold tabular-nums">{user.balance}</p>
            <p className="text-sm opacity-70">{market.pointLabel}</p>
          </div>
          <PayQRButton
            marketId={marketId}
            userId={user.user.id}
            userName={user.user.realName}
            compact
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="ghost"
          className="h-12 gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 rounded-2xl font-semibold"
          onClick={() => setTransferOpen(true)}
        >
          <ArrowRightLeft className="h-4 w-4" />
          {market.pointLabel} 전송
        </Button>
        <HomeScanButton marketId={marketId} pointLabel={market.pointLabel} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">최근 내역</h2>
          <Link
            href={`/markets/${marketId}/history`}
            className="flex items-center gap-1 text-xs text-emerald-500"
          >
            전체 보기 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {recentLogs.map((log) => {
            const label =
              log.reasonType === 'mission'
                ? log.missionTitle
                : log.reasonType === 'purchase'
                  ? log.itemName
                  : log.reasonType === 'transfer'
                    ? (log.memo ?? `${market.pointLabel} 전송`)
                    : (log.memo ?? '수동 지급')
            const isPositive = log.amount > 0
            
            return (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${isPositive ? 'bg-emerald-50' : 'bg-rose-50'}`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-rose-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-bold tabular-nums ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}
                >
                  {isPositive ? '+' : ''}
                  {log.amount}
                </span>
              </div>
            )
          })}
          {recentLogs.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">아직 내역이 없어요</p>
          )}
        </div>
      </div>
      <TransferModal
        marketId={marketId}
        userId={userId}
        open={transferOpen}
        onClose={closeTransfer}
      />
    </div>
  )
}
