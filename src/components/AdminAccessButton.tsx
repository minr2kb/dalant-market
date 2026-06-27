'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { ShieldCheck, Lock, X } from 'lucide-react'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { useModalHistory } from '@/hooks/use-modal-history'
import { adminQuery } from '@/lib/query/queries'

const STORAGE_KEY = 'dalant_admin_granted'
const CODE_LENGTH = 4

export function AdminAccessButton({
  marketId,
  compact = false,
}: {
  marketId: string
  compact?: boolean
}) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    setIsAdmin(localStorage.getItem(STORAGE_KEY) === 'true')
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    setCode('')
    setError(false)
  }, [])
  useModalHistory(open, close)

  const authMutation = useMutation(adminQuery.auth())

  function handleChange(val: string) {
    setCode(val)
    setError(false)
    if (val.length === CODE_LENGTH) {
      authMutation
        .mutateAsync({ marketId, code: val })
        .then((result) => {
          if (result.data.granted) {
            localStorage.setItem(STORAGE_KEY, 'true')
            setIsAdmin(true)
            window.history.back()
            router.push(`/markets/${marketId}/admin/home`)
          } else {
            setError(true)
            setTimeout(() => setCode(''), 600)
          }
        })
        .catch(() => {
          setError(true)
          setTimeout(() => setCode(''), 600)
        })
    }
  }

  if (isAdmin) {
    return compact ? (
      <a
        href={`/markets/${marketId}/admin/home`}
        className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 active:scale-95 transition-all"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        관리자
      </a>
    ) : (
      <a
        href={`/markets/${marketId}/admin/home`}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-white text-sm font-semibold text-purple-600 transition-colors hover:bg-purple-50"
      >
        <ShieldCheck className="h-4 w-4" />
        관리자 화면
      </a>
    )
  }

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
        >
          <Lock className="h-3.5 w-3.5" />
          관리자
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-sm font-medium text-gray-400 transition-colors hover:bg-gray-50"
        >
          <Lock className="h-4 w-4" />
          관리자 전환
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400">관리자 인증</p>
                <h3 className="font-bold text-gray-900">인증코드 입력</h3>
              </div>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3">
              <InputOTP
                maxLength={CODE_LENGTH}
                value={code}
                onChange={handleChange}
                disabled={authMutation.isPending}
                autoFocus
              >
                <InputOTPGroup className="gap-3">
                  {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className={`h-14 w-14 rounded-xl border text-xl font-bold first:rounded-l-xl first:border-l last:rounded-r-xl ${
                        error
                          ? 'border-rose-400 bg-rose-50 text-rose-600'
                          : 'border-gray-200'
                      }`}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              {error ? (
                <p className="text-xs text-rose-500">인증코드가 올바르지 않아요</p>
              ) : authMutation.isPending ? (
                <p className="text-xs text-gray-400">확인 중…</p>
              ) : (
                <p className="text-xs text-gray-400">관리자에게 받은 4자리 코드를 입력하세요</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
