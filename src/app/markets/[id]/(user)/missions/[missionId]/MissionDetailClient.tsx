'use client'

import { useState, useEffect } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ChevronLeft, CheckCircle2, Loader2, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { MissionSlot } from '@/components/MissionSlot'
import { QRModal } from '@/components/QRModal'
import { uploadMissionPhoto } from '@/lib/upload'
import { getMissionStatus } from '@/types'
import { missionsQuery, marketsQuery } from '@/lib/query/queries'

const MAX_PHOTOS = 3

const TYPE_LABEL: Record<string, string> = {
  user_qr: '유저 간 인증',
  upload: '업로드형',
  admin_qr: '관리자 인증',
  manual: '상시',
}

const QR_HINT: Record<string, string> = {
  user_qr: '유저 간 인증 미션: 상대방이 이 QR을 찍어줘야 해요',
  upload: '업로드형 미션: 관리자에게 QR을 보여주세요',
  admin_qr: '관리자 인증 미션: 관리자에게 QR을 보여주세요',
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

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(photoUrls))
  }, [storageKey, photoUrls])

  const { data: missionData } = useSuspenseQuery(
    missionsQuery.get({ marketId, missionId, userId })
  )
  const { data: marketData } = useSuspenseQuery(
    marketsQuery.get({ marketId })
  )

  const mission = missionData.data
  const market = marketData.data

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

  const nextPendingSlot = mission.slots?.find((s) => s.verifiedAt === null)
  const isPast = getMissionStatus(mission) === 'past'
  const isUserDone = !nextPendingSlot && (mission.slots?.length ?? 0) > 0
  const isLocked = isPast || isUserDone

  return (
    <div>
      <div className="flex items-center gap-3 px-4 pb-4 max-w-lg mx-auto">
          <Link href={`/markets/${marketId}/missions`} className="text-gray-400 dark:text-gray-500">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{mission.title}</h1>
        </div>

        <div className="px-4 max-w-lg mx-auto space-y-6">
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">{TYPE_LABEL[mission.type]}</span>
              <span className="text-lg font-bold text-emerald-500">+{mission.reward} {market.pointLabel}</span>
            </div>
            {mission.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{mission.description}</p>
            )}
            {mission.isGroup && (
              <span className="inline-block rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-600">
                단체 미션
              </span>
            )}
          </div>

          {isLocked ? (
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-5 text-center space-y-1.5">
              <CheckCircle2 className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {isPast ? '기간이 종료된 미션이에요' : '이미 완료한 미션이에요'}
              </p>
            </div>
          ) : mission.type === 'manual' ? (
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-6 text-center space-y-2">
              <CheckCircle2 className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                관리자가 수동으로 지급하는 상시 미션이에요
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                별도 인증 없이 관리자가 직접 지급합니다
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
                      <label className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 hover:border-emerald-300 hover:text-emerald-400 transition-colors">
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
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500">
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
                  buttonText={`${nextPendingSlot.slot}회차 인증하기`}
                />
              )}
              {mission.type === 'admin_qr' && (
                <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                  관리자에게 직접 가서 이 QR을 보여주세요
                </p>
              )}
              {mission.type === 'user_qr' && (
                <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                  내 QR을 보여주면 상대방이 홈 화면에서 스캔해줘요
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">인증 현황</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {mission.slots?.map((slot) => (
                <MissionSlot key={slot.slot} slot={slot} slotNumber={slot.slot} />
              ))}
            </div>
          </div>
        </div>
      </div>
  )
}
