'use client'

import { useState } from 'react'
import { ScanLine, CheckCircle2 } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { QRScanner } from '@/components/QRScanner'
import { parseQR } from '@/lib/qr'
import { participantsQuery, missionsQuery } from '@/lib/query/queries'
import type { MarketParticipant } from '@/types'

type ScanTarget = { participant: MarketParticipant; missionId: string }

export function HomeScanButton({ marketId }: { marketId: string }) {
  const [open, setOpen] = useState(false)
  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null)
  const [done, setDone] = useState(false)

  const { data: participantsData } = useQuery(participantsQuery.list({ marketId }))
  const participants = participantsData?.data ?? []

  const verifyMutation = useMutation(
    missionsQuery.verify({ invalidates: [missionsQuery.$key] })
  )

  function handleScan(val: string) {
    const qr = parseQR(val)
    if (qr?.type !== 'mission') return
    const participant = participants.find((p) => p.user.id === qr.userId)
    if (participant) setScanTarget({ participant, missionId: qr.missionId })
  }

  async function handleVerify() {
    if (!scanTarget) return
    await verifyMutation.mutateAsync({
      marketId,
      missionId: scanTarget.missionId,
      userId: scanTarget.participant.user.id,
    })
    setDone(true)
  }

  function handleClose() {
    setOpen(false)
    setScanTarget(null)
    setDone(false)
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
      >
        {scanTarget && !done && (
          <div className="flex flex-1 flex-col justify-end">
            <div className="rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-5">
              <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-base font-bold text-emerald-600">
                  {scanTarget.participant.displayName[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{scanTarget.participant.displayName}님의 QR</p>
                  <p className="text-sm text-gray-500">인증하면 달란트가 지급됩니다</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setScanTarget(null)}
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
            </div>
          </div>
        )}
        {done && scanTarget && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <CheckCircle2 className="h-20 w-20 text-emerald-400" />
            <div>
              <p className="text-xl font-bold text-white">인증 완료!</p>
              <p className="mt-1 text-sm text-white/60">{scanTarget.participant.displayName}님 달란트 적립됨</p>
            </div>
            <Button
              onClick={handleClose}
              className="mt-4 h-12 w-full max-w-xs rounded-full bg-white text-sm font-semibold text-gray-900 hover:bg-white/90"
            >
              확인
            </Button>
          </div>
        )}
      </QRScanner>
    </>
  )
}
