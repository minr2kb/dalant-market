'use client'

import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MOCK_MISSIONS } from '@/lib/mock-data'
import type { Mission, MissionType } from '@/types'

const TYPE_LABEL: Record<MissionType, string> = {
  upload: '사진+QR',
  qr: 'QR 즉시',
  admin_grant: '관리자 지급',
}

export default function AdminMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>(MOCK_MISSIONS)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function toggleActive(id: string) {
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m)),
    )
  }

  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">미션 관리</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
        >
          <Plus className="mr-1 h-4 w-4" />
          미션 추가
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-emerald-700">새 미션</h3>
          <Input placeholder="미션 이름" className="rounded-xl bg-white" />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="달란트 수량" type="number" className="rounded-xl bg-white" />
            <Input placeholder="최대 횟수" type="number" className="rounded-xl bg-white" />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
            >
              추가
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(false)}
              className="rounded-full"
            >
              취소
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="rounded-2xl border border-gray-100 bg-white overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-4">
              <button
                type="button"
                onClick={() =>
                  setExpandedId(expandedId === mission.id ? null : mission.id)
                }
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-semibold ${
                      mission.isActive ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {mission.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {TYPE_LABEL[mission.type]} · +{mission.reward} · {mission.limitCount}회
                  </p>
                </div>
                {expandedId === mission.id ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleActive(mission.id)}
                className={`relative ml-3 h-6 w-11 shrink-0 rounded-full transition-colors ${
                  mission.isActive ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    mission.isActive ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {expandedId === mission.id && (
              <div className="grid grid-cols-2 gap-2 border-t border-gray-50 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                <div>
                  <p className="text-gray-400">타입</p>
                  <p className="font-medium">{TYPE_LABEL[mission.type]}</p>
                </div>
                <div>
                  <p className="text-gray-400">달란트</p>
                  <p className="font-medium">+{mission.reward}</p>
                </div>
                <div>
                  <p className="text-gray-400">최대 횟수</p>
                  <p className="font-medium">{mission.limitCount}회</p>
                </div>
                <div>
                  <p className="text-gray-400">단체 미션</p>
                  <p className="font-medium">{mission.isGroup ? '예' : '아니오'}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
