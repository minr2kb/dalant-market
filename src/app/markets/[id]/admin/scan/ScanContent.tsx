'use client'

import { Suspense, useState } from 'react'
import { useSuspenseQueries, useMutation } from '@tanstack/react-query'
import { CheckCircle2, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { QRScanner } from '@/components/QRScanner'
import { parseQR } from '@/lib/qr'
import { missionsQuery, participantsQuery } from '@/lib/query/queries'
import type { Mission, MarketParticipant } from '@/types'

type ScanState = 'idle' | 'picking_mission' | 'picking_user' | 'confirm' | 'group' | 'done'

function ScanInner({ marketId }: { marketId: string }) {
  const router = useRouter()

  const [{ data: missionsData }, { data: participantsData }] = useSuspenseQueries({
    queries: [
      missionsQuery.list({ marketId }),
      participantsQuery.list({ marketId }),
    ],
  })
  const missions = missionsData.data.filter(
    (m) => m.isActive && (m.type === 'admin_qr' || m.type === 'upload'),
  )
  const participants = participantsData.data

  const verifyMutation = useMutation(
    missionsQuery.verify({
      invalidates: [missionsQuery.$key, participantsQuery.$key],
    }),
  )

  const [state, setState] = useState<ScanState>('idle')
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [selectedUser, setSelectedUser] = useState<MarketParticipant | null>(null)
  const [groupUsers, setGroupUsers] = useState<string[]>([])
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null)

  function handleScan(val: string) {
    const qr = parseQR(val)
    if (qr) {
      const participant = participants.find((p) => p.user.id === qr.userId)
      if (participant) setSelectedUser(participant)

      if (qr.type === 'mission') {
        if (qr.photoUrl) setPendingPhotoUrl(qr.photoUrl)
        const mission = missions.find((m) => m.id === qr.missionId)
        if (mission && participant) {
          setSelectedMission(mission)
          setState('confirm')
          return
        }
      }
    }
    setState('picking_mission')
  }

  function handleSimulate() {
    const mission = missions[0]
    const participant = participants[0]
    if (mission && participant) {
      setSelectedMission(mission)
      setSelectedUser(participant)
      setState('confirm')
    } else {
      setState('picking_mission')
    }
  }

  function selectMission(mission: Mission) {
    setSelectedMission(mission)
    setState(selectedUser ? 'confirm' : 'picking_user')
  }

  function selectUser(participant: MarketParticipant) {
    setSelectedUser(participant)
    setState('confirm')
  }

  function toggleGroupUser(uid: string) {
    setGroupUsers((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid],
    )
  }

  async function confirmVerify(extraUserIds: string[] = []) {
    if (!selectedMission || !selectedUser) return
    const allUserIds = [selectedUser.user.id, ...extraUserIds]
    const results = await Promise.allSettled(
      allUserIds.map((uid) =>
        verifyMutation.mutateAsync({
          marketId,
          missionId: selectedMission.id,
          userId: uid,
          ...(pendingPhotoUrl ? { photoUrl: pendingPhotoUrl } : {}),
        }),
      ),
    )
    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0) {
      toast.error(`${failed.length}명 적립 실패`, {
        description: '일부 인원의 달란트 적립에 실패했습니다.',
      })
    }
    if (results.some((r) => r.status === 'fulfilled')) {
      setState('done')
    }
  }

  function reset() {
    setState('idle')
    setSelectedMission(null)
    setSelectedUser(null)
    setGroupUsers([])
    setPendingPhotoUrl(null)
  }

  const otherParticipants = participants.filter((p) => p.user.id !== selectedUser?.user.id)

  return (
    <QRScanner
      open
      title="QR 스캔"
      hint="미션 인증 QR을 화면 중앙에 맞춰주세요"
      onScan={handleScan}
      onSimulate={handleSimulate}
      onClose={() => router.back()}
    >
      {state === 'picking_mission' && (
        <div className="flex flex-1 flex-col justify-end">
          <div className="rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-4">
            <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
            <p className="text-sm font-semibold text-gray-700">어떤 미션인가요?</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {missions.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">활성 미션이 없어요</p>
              ) : (
                missions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selectMission(m)}
                    className="flex h-14 w-full items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 text-left hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                  >
                    <span className="text-sm font-semibold text-gray-800">{m.title}</span>
                    <span className="text-sm font-bold text-emerald-500">+{m.reward}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {state === 'picking_user' && selectedMission && (
        <div className="flex flex-1 flex-col justify-end">
          <div className="rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-4">
            <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
            <div>
              <p className="text-sm font-semibold text-gray-700">누구의 QR인가요?</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedMission.title} · +{selectedMission.reward} 달란트
              </p>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {participants.map((p) => (
                <button
                  key={p.user.id}
                  type="button"
                  onClick={() => selectUser(p)}
                  className="flex h-14 w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 text-left hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                    {p.user.realName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.user.realName}</p>
                    <p className="text-xs text-gray-400">{p.balance} 달란트 보유</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {state === 'confirm' && selectedMission && selectedUser && (
        <div className="flex flex-1 flex-col justify-end">
          <div className="rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-5">
            <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-400">미션 인증 요청</p>
              <h3 className="text-lg font-bold text-gray-900">{selectedMission.title}</h3>
              <p className="text-sm text-gray-500">
                {selectedUser.user.realName} · +{selectedMission.reward} 달란트
              </p>
            </div>
            {selectedMission.type === 'upload' && pendingPhotoUrl && (
              <img
                src={pendingPhotoUrl}
                alt="업로드된 사진"
                className="w-full max-h-48 rounded-2xl object-cover"
              />
            )}
            {selectedMission.type === 'upload' && !pendingPhotoUrl && (
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-center">
                <p className="text-sm text-amber-700">QR에 사진이 포함되지 않았어요</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={reset}
                className="h-12 flex-1 rounded-full text-sm font-semibold"
              >
                취소
              </Button>
              <Button
                onClick={() =>
                  selectedMission.isGroup ? setState('group') : confirmVerify()
                }
                className="h-12 flex-1 rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {state === 'group' && selectedMission && selectedUser && (
        <div className="flex flex-1 flex-col justify-end">
          <div className="rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-4">
            <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-500" />
              <h3 className="font-bold text-gray-900">단체 미션 — 함께한 참여자</h3>
            </div>
            <div className="max-h-44 overflow-y-auto space-y-2">
              {otherParticipants.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleGroupUser(p.user.id)}
                  className={`flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm font-medium transition-colors ${
                    groupUsers.includes(p.user.id)
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>{p.user.realName}</span>
                  {groupUsers.includes(p.user.id) && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </button>
              ))}
            </div>
            <Button
              onClick={() => confirmVerify(groupUsers)}
              className="h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              {groupUsers.length > 0 ? `${groupUsers.length + 1}명 달란트 적립` : '본인만 적립'}
            </Button>
          </div>
        </div>
      )}

      {state === 'done' && selectedMission && selectedUser && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <CheckCircle2 className="h-20 w-20 text-emerald-400" />
          <div>
            <p className="text-xl font-bold text-white">달란트 적립 완료!</p>
            <p className="mt-1 text-sm text-white/60">
              {selectedMission.title} · +{selectedMission.reward} 달란트
            </p>
          </div>
          <Button
            onClick={reset}
            className="mt-4 h-12 w-full max-w-xs rounded-full bg-white text-sm font-semibold text-gray-900 hover:bg-white/90"
          >
            다음 스캔
          </Button>
        </div>
      )}
    </QRScanner>
  )
}

export function ScanContent({ marketId }: { marketId: string }) {
  return (
    <Suspense fallback={<p className="py-8 text-center text-sm text-gray-400">불러오는 중…</p>}>
      <ScanInner marketId={marketId} />
    </Suspense>
  )
}
