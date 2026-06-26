'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ChevronLeft, Upload, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { MissionSlot } from '@/components/MissionSlot'
import { QRModal } from '@/components/QRModal'
import { MOCK_MISSIONS } from '@/lib/mock-data'

const TYPE_LABEL: Record<string, string> = {
  user_qr: '유저 간 인증',
  upload: '업로드형',
  admin_qr: '관리자 인증',
  manual: '상시',
}

export default function MissionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const missionId = params.missionId as string
  const [photoUploaded, setPhotoUploaded] = useState(false)

  const mission = MOCK_MISSIONS.find((m) => m.id === missionId) ?? MOCK_MISSIONS[0]
  const nextPendingSlot = mission.slots?.find((s) => s.verifiedAt === null)

  return (
    <div className="min-h-svh bg-white">
      <div className="flex items-center gap-3 px-4 pt-14 pb-4">
        <Link href={`/markets/${id}/missions`} className="text-gray-400">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{mission.title}</h1>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{TYPE_LABEL[mission.type]}</span>
            <span className="text-lg font-bold text-emerald-500">
              +{mission.reward} 달란트
            </span>
          </div>
          {mission.isGroup && (
            <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              단체 미션
            </span>
          )}
        </div>

        {mission.type === 'manual' ? (
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
              <button
                type="button"
                onClick={() => setPhotoUploaded(true)}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-6 text-sm font-medium transition-colors ${
                  photoUploaded
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                    : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                }`}
              >
                {photoUploaded ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    사진 업로드 완료
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    사진 업로드
                  </>
                )}
              </button>
            )}

            {nextPendingSlot && (
              <QRModal
                missionTitle={mission.title}
                disabled={mission.type === 'upload' && !photoUploaded}
              />
            )}

            {mission.type === 'upload' && !photoUploaded && (
              <p className="text-center text-xs text-gray-400">
                사진을 업로드해야 QR을 생성할 수 있어요
              </p>
            )}
            {mission.type === 'admin_qr' && (
              <p className="text-center text-xs text-gray-400">
                관리자에게 직접 가서 이 QR을 보여주세요
              </p>
            )}
            {mission.type === 'user_qr' && (
              <p className="text-center text-xs text-gray-400">
                다른 참여자에게 이 QR을 보여주면 상대방이 찍어줘요
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
  )
}
