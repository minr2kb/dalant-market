'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, CheckSquare, Square, Plus, Minus, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MOCK_PARTICIPANTS } from '@/lib/mock-data'
import { use } from 'react'

export default function AdminPointsPage(props: PageProps<'/markets/[id]/admin/points'>) {
  const { id } = use(props.params)
  const participants = MOCK_PARTICIPANTS

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [done, setDone] = useState(false)

  const allSelected = selected.size === participants.length
  const n = Number(amount)

  function toggleAll() {
    setSelected(
      allSelected ? new Set() : new Set(participants.map((p) => p.user.id))
    )
  }

  function toggle(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(uid) ? next.delete(uid) : next.add(uid)
      return next
    })
  }

  function apply(sign: 1 | -1) {
    if (!n || selected.size === 0) return
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }

  return (
    <div className="min-h-svh bg-white">
      <div className="flex items-center gap-3 px-4 pt-14 pb-4">
        <Link href={`/markets/${id}/admin/home`} className="text-gray-400">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">달란트 일괄 지급</h1>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-5">
        {/* 지급 설정 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">지급 설정</p>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="달란트 수량"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl w-36 text-center tabular-nums text-base font-bold"
            />
            <Input
              placeholder="메모 (예: 팀전 우승)"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="rounded-xl flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => apply(1)}
              disabled={!n || selected.size === 0}
              className="flex-1 h-11 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 gap-1.5 font-semibold disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              {selected.size > 0 && n ? `${selected.size}명에게 +${n} 지급` : '지급'}
            </Button>
            <Button
              onClick={() => apply(-1)}
              disabled={!n || selected.size === 0}
              variant="outline"
              className="flex-1 h-11 rounded-xl border-rose-200 text-rose-500 hover:bg-rose-50 gap-1.5 font-semibold disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
              {selected.size > 0 && n ? `${selected.size}명에게 -${n} 차감` : '차감'}
            </Button>
          </div>
          {done && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-600">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {selected.size}명에게 적용됐어요
            </div>
          )}
        </div>

        {/* 전체 선택 */}
        <button
          type="button"
          onClick={toggleAll}
          className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left hover:bg-gray-50"
        >
          {allSelected
            ? <CheckSquare className="h-5 w-5 text-emerald-500 shrink-0" />
            : <Square className="h-5 w-5 text-gray-300 shrink-0" />
          }
          <span className="text-sm font-semibold text-gray-700">
            전체 선택 ({selected.size}/{participants.length})
          </span>
        </button>

        {/* 유저 목록 */}
        <div className="space-y-2">
          {participants.map((p) => {
            const isSelected = selected.has(p.user.id)
            return (
              <button
                key={p.user.id}
                type="button"
                onClick={() => toggle(p.user.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-gray-100 bg-white hover:bg-gray-50'
                }`}
              >
                {isSelected
                  ? <CheckSquare className="h-5 w-5 text-emerald-500 shrink-0" />
                  : <Square className="h-5 w-5 text-gray-300 shrink-0" />
                }
                <div className="flex min-w-0 flex-1 items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                      {p.user.realName[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{p.user.realName}</p>
                      {p.role === 'admin' && (
                        <span className="text-[10px] text-purple-500">관리자</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums text-emerald-500">{p.balance}</p>
                    {n > 0 && isSelected && (
                      <p className="text-xs tabular-nums text-gray-400">→ {p.balance + n}</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
