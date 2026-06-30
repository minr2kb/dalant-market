'use client'

import { useState } from 'react'
import { ScanLine, CheckCircle2, X } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { QRScanner } from '@/components/QRScanner'
import { parseQR } from '@/lib/qr'
import { participantsQuery, missionsQuery } from '@/lib/query/queries'
import type { MarketParticipant } from '@/types'

type ScanTarget = { participant: MarketParticipant; missionId: string; token: string; missionTitle: string; reward: number }

export function HomeScanButton({ marketId, pointLabel }: { marketId: string; pointLabel: string }) {
  const [open, setOpen] = useState(false)
  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null)
  const [done, setDone] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const { data: participantsData } = useQuery(participantsQuery.list({ marketId }))
  const { data: missionsData } = useQuery(missionsQuery.list({ marketId }))
  const participants = participantsData?.data ?? []
  const missions = missionsData?.data ?? []

  const verifyMutation = useMutation(
    missionsQuery.verify({ invalidates: [missionsQuery.$key] })
  )

  function handleScan(val: string) {
    const qr = parseQR(val)
    if (!qr || qr.type !== 'mission') {
      if (qr?.type === 'pay') toast.error('결제 QR이에요', { description: '달란트 전송 기능을 이용해주세요' })
      return
    }
    const participant = participants.find((p) => p.user.id === qr.userId)
    const mission = missions.find((m) => m.id === qr.missionId)
    if (!participant) { toast.error('이 마켓의 참여자 QR이 아니에요'); return }
    if (!mission) { toast.error('인식할 수 없는 미션이에요'); return }
    if (mission.type !== 'user_qr') { toast.error('관리자 인증이 필요한 미션이에요'); return }
    setScanTarget({ participant, missionId: qr.missionId, token: qr.token, missionTitle: mission.title, reward: mission.reward })
    setVerifyError(null)
  }

  async function handleVerify() {
    if (!scanTarget) return
    setVerifyError(null)
    try {
      await verifyMutation.mutateAsync({
        marketId,
        missionId: scanTarget.missionId,
        token: scanTarget.token,
      })
      setDone(true)
    } catch (e) {
      setVerifyError((e as any)?.body?.error ?? '인증에 실패했어요')
    }
  }

  function handleClose() {
    setOpen(false)
    setScanTarget(null)
    setDone(false)
    setVerifyError(null)
    verifyMutation.reset()
  }

  function handleModalClose() {
    setScanTarget(null)
    setDone(false)
    setVerifyError(null)
    verifyMutation.reset()
  }

  return (
    <>
      <Button
        className="h-12 w-full gap-2 rounded-2xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
        onClick={() => setOpen(true)}
      >
        <ScanLine className="h-4 w-4" />
        QR 인증해주기
      </Button>

      <QRScanner
        open={open}
        title="상대방 QR 스캔"
        hint="상대방의 미션 QR을 화면 중앙에 맞춰주세요"
        onScan={handleScan}
        onClose={handleClose}
      />

      {(scanTarget || done) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-5">
            {!done ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-400">미션 인증 요청</p>
                  <button type="button" onClick={handleModalClose} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{scanTarget!.missionTitle}</p>
                  <p className="text-sm text-emerald-600 font-semibold">+{scanTarget!.reward} {pointLabel}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-600">
                    {scanTarget!.participant.displayName[0]}
                  </div>
                  <p className="font-medium text-gray-800">{scanTarget!.participant.displayName}님의 QR</p>
                </div>
                {verifyError && (
                  <p className="rounded-xl bg-red-50 px-4 py-2 text-center text-sm font-medium text-red-600">
                    {verifyError}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleModalClose}
                    className="h-12 flex-1 rounded-full text-sm font-semibold"
                  >
                    다시 스캔
                  </Button>
                  <Button
                    onClick={handleVerify}
                    disabled={verifyMutation.isPending}
                    className="h-12 flex-1 rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600"
                  >
                    인증하기
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <CheckCircle2 className="h-16 w-16 text-emerald-400" />
                <div>
                  <p className="text-xl font-bold text-gray-900">인증 완료!</p>
                  <p className="mt-1 text-sm text-gray-500">{scanTarget!.participant.displayName}님 {pointLabel} 적립됨</p>
                </div>
                <Button
                  onClick={handleClose}
                  className="h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600"
                >
                  확인
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
