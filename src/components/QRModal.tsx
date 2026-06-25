'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { QrCode, X } from 'lucide-react'
import { useModalHistory } from '@/hooks/use-modal-history'

interface QRModalProps {
  missionTitle: string
  disabled?: boolean
}

export function QRModal({ missionTitle, disabled = false }: QRModalProps) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  useModalHistory(open, close)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="w-full rounded-full bg-emerald-500 py-3 text-base font-medium text-white hover:bg-emerald-600 disabled:opacity-40"
      >
        <QrCode className="mr-2 h-5 w-5" />
        QR 생성하기
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{missionTitle}</h3>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
              <div className="text-center space-y-2">
                <QrCode className="mx-auto h-16 w-16 text-gray-300" />
                <p className="text-xs text-gray-400">QR 코드</p>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 px-4 py-3 text-center">
              <p className="text-sm font-medium text-amber-700">5분 후 만료됩니다</p>
              <p className="text-xs text-amber-600 mt-0.5">상대방 카메라로 스캔해주세요</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
