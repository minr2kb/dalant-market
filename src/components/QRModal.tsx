'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { QrCode, X } from 'lucide-react'
import QRCode from 'react-qr-code'
import { useModalHistory } from '@/hooks/use-modal-history'
import { encodeMissionQR } from '@/lib/qr'

interface QRModalProps {
  marketId: string
  missionId: string
  userId: string
  missionTitle: string
  photoUrls?: string[]
  hint?: string
  disabled?: boolean
  buttonText?: string
}

export function QRModal({ marketId, missionId, userId, missionTitle, photoUrls, hint, disabled = false, buttonText = 'QR 생성하기' }: QRModalProps) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  useModalHistory(open, close)

  const qrValue = encodeMissionQR(marketId, missionId, userId, photoUrls)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="h-12 w-full rounded-full bg-emerald-500 text-base font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
      >
        <QrCode className="mr-2 h-5 w-5" />
        {buttonText}
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

            <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-2xl bg-white p-2">
              <QRCode value={qrValue} size={192} />
            </div>

            <div className="rounded-xl bg-amber-50 px-4 py-3 text-center">
              <p className="text-sm font-medium text-amber-700">카메라로 스캔해주세요</p>
              {hint && <p className="text-xs text-amber-600 mt-0.5">{hint}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
