import { TrendingUp, TrendingDown, Award } from 'lucide-react'
import type { PointLog } from '@/types'

interface PointLogItemProps {
  log: PointLog
}

export function PointLogItem({ log }: PointLogItemProps) {
  const isPositive = log.amount > 0

  const label =
    log.reasonType === 'mission'
      ? (log.missionTitle ?? '미션')
      : log.reasonType === 'purchase'
      ? (log.itemName ?? '구매')
      : (log.memo ?? '수동 지급')

  const sub =
    log.reasonType === 'mission' && log.verifiedByName
      ? `${log.verifiedByName} 인증`
      : log.reasonType === 'purchase'
      ? '마켓 구매'
      : '관리자 지급'

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            isPositive
              ? log.reasonType === 'manual'
                ? 'bg-purple-50'
                : 'bg-emerald-50'
              : 'bg-rose-50'
          }`}
        >
          {isPositive ? (
            log.reasonType === 'manual' ? (
              <Award className="h-4 w-4 text-purple-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            )
          ) : (
            <TrendingDown className="h-4 w-4 text-rose-500" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-xs text-gray-400">{sub}</p>
          <p className="text-xs text-gray-300">
            {new Date(log.createdAt).toLocaleString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
      <span
        className={`text-sm font-bold tabular-nums ${
          isPositive
            ? log.reasonType === 'manual'
              ? 'text-purple-500'
              : 'text-emerald-500'
            : 'text-rose-500'
        }`}
      >
        {isPositive ? '+' : ''}
        {log.amount}
      </span>
    </div>
  )
}
