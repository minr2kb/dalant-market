'use client'

import { useMemo } from 'react'
import { useSuspenseQueries } from '@tanstack/react-query'
import { orderBy } from 'es-toolkit'
import { marketsQuery, participantsQuery } from '@/lib/query/queries'
import { cn } from '@/lib/utils'

export function RankingClient({ marketId, userId }: { marketId: string; userId: string }) {
  const [{ data: marketData }, { data: participantsData }] = useSuspenseQueries({
    queries: [
      marketsQuery.get({ marketId }),
      participantsQuery.list({ marketId }),
    ],
  })

  const market = marketData.data
  const ranked = useMemo(
    () => orderBy(participantsData.data, [(p) => p.balance], ['desc']),
    [participantsData.data],
  )
  const maxBalance = ranked[0]?.balance ?? 0
  const pct = (balance: number) =>
    maxBalance > 0 ? Math.round((balance / maxBalance) * 100) : 0

  const top3 = ranked.slice(0, 3)
  const rest = ranked.slice(3)

  // Podium order: 2nd(left), 1st(center), 3rd(right)
  const podiumOrder = [top3[1], top3[0], top3[2]]
  const podiumConfig = [
    { medal: '🥈', blockH: 'h-16', blockBg: 'bg-emerald-200', labelColor: 'text-gray-700' },
    { medal: '🥇', blockH: 'h-24', blockBg: 'bg-emerald-400', labelColor: 'text-gray-900' },
    { medal: '🥉', blockH: 'h-10', blockBg: 'bg-slate-300',   labelColor: 'text-gray-500' },
  ]

  return (
    <div className="px-4 space-y-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900">랭킹</h1>

      {/* Podium */}
      {ranked.length > 0 && (
        <div className="flex items-end justify-center gap-3 pb-1">
          {podiumOrder.map((p, i) => {
            if (!p) return <div key={i} className="flex-1" />
            const cfg = podiumConfig[i]
            const isMe = p.user.id === userId
            return (
              <div key={p.id} className="flex flex-1 flex-col items-center gap-1">
                <p className={cn('w-full truncate text-center text-sm font-bold', cfg.labelColor)}>
                  {p.displayName}
                  {isMe && <span className="ml-1 text-[10px] font-normal text-emerald-500">나</span>}
                </p>
                <p className="text-xs text-gray-400 tabular-nums">
                  {p.balance} {market.pointLabel}
                </p>
                <div className={cn('w-full rounded-t-2xl flex items-center justify-center', cfg.blockH, cfg.blockBg)}>
                  <span className="text-2xl">{cfg.medal}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 4위 이하 */}
      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((p, i) => {
            const rank = i + 4
            const isMe = p.user.id === userId
            const barPct = pct(p.balance)
            return (
              <div
                key={p.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-4 py-3',
                  isMe ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-white',
                )}
              >
                <span className="w-5 shrink-0 text-center text-sm font-bold text-gray-400">
                  {rank}
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className={cn('truncate text-sm font-semibold', isMe ? 'text-emerald-700' : 'text-gray-900')}>
                    {p.displayName}
                    {isMe && <span className="ml-1 text-xs font-normal text-emerald-500">(나)</span>}
                  </p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn('h-full rounded-full transition-all', isMe ? 'bg-emerald-400' : 'bg-emerald-300')}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
                <span className={cn('shrink-0 text-sm font-bold tabular-nums', isMe ? 'text-emerald-600' : 'text-gray-700')}>
                  {p.balance} {market.pointLabel}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {ranked.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-400">아직 참가자가 없어요</p>
      )}
    </div>
  )
}
