'use client'

import { useState, useCallback } from 'react'
import { QrCode, X } from 'lucide-react'
import { useModalHistory } from '@/hooks/use-modal-history'

export function PayQRButton({
  userName,
  compact = false,
}: {
  userName: string
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  useModalHistory(open, close)

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 active:scale-95 transition-transform self-center"
        >
          <QrCode className="h-5 w-5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 active:scale-95"
        >
          <Wallet className="h-4 w-4" />
          달란트 사용하기
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400">결제용 QR</p>
                <h3 className="font-bold text-gray-900">{userName}</h3>
              </div>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
              <div className="text-center space-y-2">
                <QrCode className="mx-auto h-20 w-20 text-gray-300" />
                <p className="text-xs text-gray-400">관리자가 스캔합니다</p>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400">
              이 QR을 마켓 관리자에게 보여주세요
            </p>
          </div>
        </div>
      )}
    </>
  )
}
