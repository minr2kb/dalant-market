'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSuspenseQueries, useMutation } from '@tanstack/react-query'
import { ChevronLeft, CheckCircle2, ScanLine, Loader2, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { MissionSlot } from '@/components/MissionSlot'
import { QRModal } from '@/components/QRModal'
import { QRScanner } from '@/components/QRScanner'
import { Button } from '@/components/ui/button'
import { parseQR } from '@/lib/qr'
import { uploadMissionPhoto } from '@/lib/upload'
import { getMissionStatus } from '@/types'
import type { MarketParticipant } from '@/types'
import { missionsQuery, participantsQuery } from '@/lib/query/queries'

const MAX_PHOTOS = 3

const TYPE_LABEL: Record<string, string> = {
  user_qr: '유저 간 인증',
  upload: '업로드형',
  admin_qr: '관리자 인증',
  manual: '상시',
}

const QR_HINT: Record<string, string> = {
  user_qr: '유저 간 인증 미션 — 상대방이 이 QR을 찍어줘야 해요',
  upload: '업로드형 미션 — 관리자에게 QR을 보여주세요',
  admin_qr: '관리자 인증 미션 — 관리자에게 QR을 보여주세요',
}

export function MissionDetailClient({
  marketId,
  missionId,
  userId,
}: {
  marketId: string
  missionId: string
  userId: string
}) {
  const storageKey = `upload:${missionId}:${userId}`

  const [photoUrls, setPhotoUrls] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    } catch {
      return []
    }
  })
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanTarget, setScanTarget] = useState<MarketParticipant | null>(null)
  const [scanDone, setScanDone] = useState(false)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(photoUrls))
  }, [storageKey, photoUrls])

  const [{ data: missionData }, { data: participantsData }] = useSuspenseQueries({
    queries: [
      missionsQuery.get({ marketId, missionId, userId }),
      participantsQuery.list({ marketId }),
    ],
  })

  const mission = missionData.data
  const participants = participantsData.data.filter((p) => p.user.id !== userId)

  const verifyMutation = useMutation(
    missionsQuery.verify({ invalidates: [missionsQuery.$key] })
  )

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || photoUrls.length >= MAX_PHOTOS) return
    e.target.value = ''
    setUploading(true)
    setUploadError(false)
    try {
      const url = await uploadMissionPhoto(file, marketId, missionId, userId)
      setPhotoUrls((prev) => [...prev, url])
    } catch {
      setUploadError(true)
    } finally {
      setUploading(false)
    }
  }

  function removePhoto(index: number) {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index))
  }

  function handleScan(val: string) {
    const qr = parseQR(val)
    let target: MarketParticipant | undefined
    if (qr?.type === 'mission') {
      target = participants.find((p) => p.user.id === qr.userId)
    }
    setScanTarget(target ?? participants[0] ?? null)
  }

  async function verifyScanned() {
    if (!scanTarget) return
    await verifyMutation.mutateAsync({
      marketId,
      missionId,
      userId: scanTarget.user.id,
    })
    setScanDone(true)
  }

  function closeScannerAfterDone() {
    setScannerOpen(false)
    setScanTarget(null)
    setScanDone(false)
  }

  const nextPendingSlot = mission.slots?.find((s) => s.verifiedAt === null)
  const isPast = getMissionStatus(mission) === 'past'
  const isUserDone = !nextPendingSlot && (mission.slots?.length ?? 0) > 0
  const isLocked = isPast || isUserDone

  return (
    <>
      <div>
        <div className="flex items-center gap-3 px-4 pt-14 pb-4 max-w-lg mx-auto">
          <Link href={`/markets/${marketId}/missions`} className="text-gray-400">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">{mission.title}</h1>
        </div>

        <div className="px-4 max-w-lg mx-auto space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{TYPE_LABEL[mission.type]}</span>
              <span className="text-lg font-bold text-emerald-500">+{mission.reward} 달란트</span>
            </div>
            {mission.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{mission.description}</p>
            )}
            {mission.isGroup && (
              <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                단체 미션
              </span>
            )}
          </div>

          {isLocked ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-center space-y-1.5">
              <CheckCircle2 className="mx-auto h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                {isPast ? '기간이 종료된 미션이에요' : '이미 완료한 미션이에요'}
              </p>
            </div>
          ) : mission.type === 'manual' ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center space-y-2">
              <CheckCircle2 className="mx-auto h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">
                관리자가 수동으로 지급하는 상시 미션이에요
              </p>
              <p className="text-xs text-gray-400">
                별도 인증 없이 관리자가 직접 달란트를 지급합니다
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mission.type === 'upload' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {photoUrls.map((url, i) => (
                      <div key={url} className="relative aspect-square">
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full rounded-xl object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {photoUrls.length < MAX_PHOTOS && (
                      <label className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white text-gray-400 hover:border-emerald-300 hover:text-emerald-400 transition-colors">
                        {uploading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Plus className="h-5 w-5" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={handleFileChange}
                        />
                      </label>
                    )}
                  </div>
                  {uploadError && (
                    <p className="text-center text-xs text-red-500">업로드 실패. 다시 시도해주세요</p>
                  )}
                  {photoUrls.length === 0 && !uploadError && (
                    <p className="text-center text-xs text-gray-400">
                      사진을 업로드해야 QR을 생성할 수 있어요 (최대 {MAX_PHOTOS}장)
                    </p>
                  )}
                </div>
              )}
              {nextPendingSlot && (
                <QRModal
                  marketId={marketId}
                  missionId={missionId}
                  userId={userId}
                  missionTitle={mission.title}
                  photoUrls={photoUrls.length > 0 ? photoUrls : undefined}
                  hint={QR_HINT[mission.type]}
                  disabled={mission.type === 'upload' && photoUrls.length === 0}
                />
              )}
              {mission.type === 'user_qr' && (
                <Button
                  onClick={() => {
                    setScanTarget(null)
                    setScanDone(false)
                    setScannerOpen(true)
                  }}
                  variant="outline"
                  className="h-12 w-full rounded-full border-emerald-200 text-emerald-600 text-sm font-semibold hover:bg-emerald-50"
                >
                  <ScanLine className="mr-2 h-4 w-4" />
                  QR 인증해주기
                </Button>
              )}
              {mission.type === 'admin_qr' && (
                <p className="text-center text-xs text-gray-400">
                  관리자에게 직접 가서 이 QR을 보여주세요
                </p>
              )}
              {mission.type === 'user_qr' && (
                <p className="text-center text-xs text-gray-400">
                  내 QR을 보여주거나, 상대방의 QR을 직접 찍어줄 수 있어요
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">인증 현황</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {mission.slots?.map((slot) => (
                <MissionSlot key={slot.slot} slot={slot} slotNumber={slot.slot} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <QRScanner
        open={scannerOpen}
        title={`${mission.title} — 상대방 QR 스캔`}
        hint="상대방의 QR을 화면 중앙에 맞춰주세요"
        onScan={handleScan}
        onSimulate={() => setScanTarget(participants[0] ?? null)}
        onClose={() => {
          setScannerOpen(false)
          setScanTarget(null)
          setScanDone(false)
        }}
      >
        {scanTarget && !scanDone && (
          <div className="flex flex-1 flex-col justify-end">
            <div className="rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-5">
              <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-base font-bold text-emerald-600">
                  {scanTarget.user.realName[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{scanTarget.user.realName}님의 QR</p>
                  <p className="text-sm text-gray-500">
                    미션 인증 시 +{mission.reward} 달란트 적립
                  </p>
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
                  onClick={verifyScanned}
                  disabled={verifyMutation.isPending}
                  className="h-12 flex-1 rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600"
                >
                  인증하기
                </Button>
              </div>
            </div>
          </div>
        )}
        {scanDone && scanTarget && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <CheckCircle2 className="h-20 w-20 text-emerald-400" />
            <div>
              <p className="text-xl font-bold text-white">인증 완료!</p>
              <p className="mt-1 text-sm text-white/60">
                {scanTarget.user.realName}님 · +{mission.reward} 달란트 적립됨
              </p>
            </div>
            <Button
              onClick={closeScannerAfterDone}
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
