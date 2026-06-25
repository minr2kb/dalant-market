'use client'

import { useState } from 'react'
import { QrCode, CheckCircle2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MOCK_MISSIONS, MOCK_PARTICIPANTS } from '@/lib/mock-data'

type ScanState = 'idle' | 'scanned' | 'group' | 'done'

export default function ScanPage() {
  const [state, setState] = useState<ScanState>('idle')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const mockMission = MOCK_MISSIONS[2]
  const otherParticipants = MOCK_PARTICIPANTS.filter((p) => p.user.id !== 'u1')

  function handleMockScan() {
    setState('scanned')
  }

  function handleConfirm() {
    if (mockMission.isGroup) {
      setState('group')
    } else {
      setState('done')
    }
  }

  function toggleUser(userId: string) {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((uid) => uid !== userId) : [...prev, userId],
    )
  }

  return (
    <div className="relative flex min-h-svh flex-col bg-black">
      <div className="relative flex flex-1 items-center justify-center">
        <div className="flex h-64 w-64 items-center justify-center rounded-3xl border-4 border-white/30">
          <QrCode className="h-24 w-24 text-white/20" />
        </div>
        <p className="absolute bottom-32 text-sm text-white/70">
          QR 코드를 화면 중앙에 맞춰주세요
        </p>

        {state === 'idle' && (
          <button
            type="button"
            onClick={handleMockScan}
            className="absolute bottom-16 rounded-full bg-white/20 px-6 py-3 text-sm text-white hover:bg-white/30"
          >
            스캔 시뮬레이션
          </button>
        )}
      </div>

      {state === 'scanned' && (
        <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-6 space-y-5">
          <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400">미션 인증 요청</p>
            <h3 className="text-lg font-bold text-gray-900">{mockMission.title}</h3>
            <p className="text-sm text-gray-500">
              김민준 · +{mockMission.reward} 달란트
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setState('idle')}
              className="flex-1 rounded-full"
            >
              취소
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
            >
              확인
            </Button>
          </div>
        </div>
      )}

      {state === 'group' && (
        <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-6 space-y-5">
          <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-gray-900">단체 미션 — 참여자 추가</h3>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {otherParticipants.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleUser(p.user.id)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm transition-colors ${
                  selectedUsers.includes(p.user.id)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-50 text-gray-700'
                }`}
              >
                <span>{p.user.realName}</span>
                {selectedUsers.includes(p.user.id) && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </button>
            ))}
          </div>
          <Button
            onClick={() => setState('done')}
            className="w-full rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
          >
            {selectedUsers.length > 0
              ? `${selectedUsers.length + 1}명 달란트 적립`
              : '본인만 적립'}
          </Button>
        </div>
      )}

      {state === 'done' && (
        <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-6 space-y-5 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <div>
            <p className="text-lg font-bold text-gray-900">달란트 적립 완료!</p>
            <p className="text-sm text-gray-500 mt-1">
              {mockMission.title} · +{mockMission.reward} 달란트
            </p>
          </div>
          <Button
            onClick={() => {
              setState('idle')
              setSelectedUsers([])
            }}
            className="w-full rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
          >
            다음 스캔
          </Button>
        </div>
      )}
    </div>
  )
}
