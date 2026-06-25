'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import { MOCK_PARTICIPANTS } from '@/lib/mock-data'

type Mode = 'grant' | 'deduct'

export default function PointsManagePage() {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [mode, setMode] = useState<Mode>('grant')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const selectedUser = MOCK_PARTICIPANTS.find((p) => p.user.id === selectedUserId)
  const canSubmit = selectedUserId && Number(amount) > 0

  function handleSubmit() {
    if (!canSubmit) return
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setAmount('')
      setMemo('')
      setSelectedUserId('')
    }, 2000)
  }

  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">달란트 수동 관리</h1>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">참여자 선택</label>
        <div className="grid grid-cols-2 gap-2">
          {MOCK_PARTICIPANTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedUserId(p.user.id)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                selectedUserId === p.user.id
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-100 bg-white text-gray-700'
              }`}
            >
              <p className="font-medium">{p.user.realName}</p>
              <p className="text-xs text-gray-400">잔액 {p.balance}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">처리 유형</label>
        <div className="flex gap-2">
          {(['grant', 'deduct'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-colors ${
                mode === m
                  ? m === 'grant'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {m === 'grant' ? '지급' : '차감'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">달란트 수량</label>
        <Input
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          className="rounded-xl text-base"
        />
        {selectedUser && amount && (
          <p className="text-xs text-gray-400">
            처리 후 잔액:{' '}
            {mode === 'grant'
              ? selectedUser.balance + Number(amount)
              : selectedUser.balance - Number(amount)}{' '}
            달란트
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">사유 (선택)</label>
        <Input
          placeholder="예: 출석 보너스, 미션 취소 등"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="rounded-xl"
        />
      </div>

      {submitted ? (
        <div className="flex items-center justify-center gap-2 rounded-full bg-emerald-50 py-3 text-sm font-medium text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          처리 완료
        </div>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full rounded-full py-3 text-base font-medium text-white disabled:opacity-40 ${
            mode === 'grant'
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-rose-500 hover:bg-rose-600'
          }`}
        >
          {mode === 'grant' ? '달란트 지급' : '달란트 차감'}
        </Button>
      )}
    </div>
  )
}
