'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useSuspenseQueries } from '@tanstack/react-query'
import { orderBy, keyBy } from 'es-toolkit'
import { ScanLine, Coins, ShoppingBag, User, TrendingUp, TrendingDown, Gift } from 'lucide-react'
import { getMissionStatus } from '@/types'
import { marketsQuery, participantsQuery, missionsQuery, pointLogsQuery } from '@/lib/query/queries'

export function AdminHomeClient({ marketId }: { marketId: string }) {
  const [{ data: marketData }, { data: participantsData }, { data: missionsData }, { data: logsData }] =
    useSuspenseQueries({
      queries: [
        marketsQuery.get({ marketId }),
        participantsQuery.list({ marketId }),
        missionsQuery.list({ marketId }),
        pointLogsQuery.list({ marketId }),
      ],
    })

  const market = marketData.data
  const participants = participantsData.data
  const missions = missionsData.data
  const logs = logsData.data

  const activeMissions = useMemo(
    () => missions.filter((m) => getMissionStatus(m) === 'active').length,
    [missions],
  )
  const totalGranted = useMemo(
    () => logs.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0),
    [logs],
  )
  const recentLogs = useMemo(
    () => orderBy(logs, [(l) => l.createdAt], ['desc']).slice(0, 5),
    [logs],
  )
  const participantMap = useMemo(
    () => keyBy(participants, (p) => p.user.id),
    [participants],
  )

  return (
    <div className="px-4 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">{market.title}</h1>
          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-500">
            관리자
          </span>
        </div>
        <Link
          href={`/markets/${marketId}/home`}
          className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 active:scale-95 transition-all"
        >
          <User className="h-3.5 w-3.5" />
          일반화면
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white border border-gray-100 px-3 py-3.5 text-center">
          <p className="text-lg font-bold tabular-nums text-gray-900">{participants.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">참여자</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 px-3 py-3.5 text-center">
          <p className="text-lg font-bold tabular-nums text-gray-900">{activeMissions}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">활성 미션</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 px-3 py-3.5 text-center">
          <p className="text-lg font-bold tabular-nums text-emerald-500">+{totalGranted}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">총 지급</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { href: 'scan', icon: ScanLine, label: '미션 인증', bg: 'bg-emerald-50', color: 'text-emerald-500' },
          { href: 'points', icon: Coins, label: `${market.pointLabel} 지급`, bg: 'bg-purple-50', color: 'text-purple-500' },
          { href: 'pos', icon: ShoppingBag, label: '물품 결제', bg: 'bg-rose-50', color: 'text-rose-500' },
        ].map(({ href, icon: Icon, label, bg, color }) => (
          <Link
            key={href}
            href={`/markets/${marketId}/admin/${href}`}
            className="flex flex-col items-center gap-2.5 rounded-2xl border border-gray-100 bg-white py-5 transition-colors hover:bg-gray-50 active:scale-95"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-full ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <span className="text-xs font-semibold text-gray-700">{label}</span>
          </Link>
        ))}
      </div>

      {recentLogs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">최근 활동</h2>
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden divide-y divide-gray-50">
            {recentLogs.map((log) => {
              const participant = participantMap[log.userId]
              const label =
                log.reasonType === 'mission'
                  ? log.missionTitle
                  : log.reasonType === 'purchase'
                    ? log.itemName
                    : log.reasonType === 'transfer'
                      ? (log.memo ?? `${market.pointLabel} 전송`)
                      : (log.memo ?? '수동 지급')
              return (
                <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${log.amount > 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}
                  >
                    {log.amount > 0 ? (
                      log.reasonType === 'manual' ? (
                        <Gift className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      )
                    ) : (
                      <TrendingDown className="h-4 w-4 text-rose-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {participant?.user.realName ?? '알 수 없음'}
                    </p>
                    {label && <p className="text-xs text-gray-400 truncate">{label}</p>}
                  </div>
                  <span
                    className={`text-sm font-bold tabular-nums shrink-0 ${log.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                  >
                    {log.amount > 0 ? `+${log.amount}` : log.amount}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
