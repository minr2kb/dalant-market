'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Award, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react'
import type { PointLog, Order } from '@/types'

interface PointLogItemProps {
  log: PointLog
  order?: Order
}

export function PointLogItem({ log, order }: PointLogItemProps) {
  const [expanded, setExpanded] = useState(false)
  const isPositive = log.amount > 0
  const isPurchase = log.reasonType === 'purchase'

  const label =
    log.reasonType === 'mission'
      ? (log.missionTitle ?? '미션')
      : isPurchase
      ? (log.itemName ?? '마켓 구매')
      : (log.memo ?? '수동 지급')

  const sub =
    log.reasonType === 'mission' && log.verifiedByName
      ? `${log.verifiedByName} 인증`
      : isPurchase
      ? '마켓 구매'
      : '관리자 지급'

  const iconBg = isPositive
    ? log.reasonType === 'manual'
      ? 'bg-purple-50'
      : 'bg-emerald-50'
    : 'bg-rose-50'

  const amountColor = isPositive
    ? log.reasonType === 'manual'
      ? 'text-purple-500'
      : 'text-emerald-500'
    : 'text-rose-500'

  return (
    <div>
      <button
        type="button"
        onClick={() => isPurchase && order && setExpanded((v) => !v)}
        className={`flex w-full items-center justify-between py-4 text-left ${
          isPurchase && order ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${iconBg}`}>
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

        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-bold tabular-nums ${amountColor}`}>
            {isPositive ? '+' : ''}
            {log.amount}
          </span>
          {isPurchase && order && (
            expanded
              ? <ChevronUp className="h-4 w-4 text-gray-300" />
              : <ChevronDown className="h-4 w-4 text-gray-300" />
          )}
        </div>
      </button>

      {expanded && order && (
        <div className="mb-3 rounded-xl bg-gray-50 px-4 py-3 space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <ShoppingBag className="h-3.5 w-3.5 text-gray-400" />
                <span>{item.name} × {item.qty}</span>
              </div>
              <span className="tabular-nums text-gray-500">{item.price * item.qty}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-gray-100 pt-2 text-xs text-gray-400">
            <span>{order.verifiedByName} 처리</span>
            <span className="font-medium tabular-nums text-rose-400">-{order.total} 합계</span>
          </div>
        </div>
      )}
    </div>
  )
}
