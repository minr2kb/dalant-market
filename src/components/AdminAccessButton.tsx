'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, X, Lock } from 'lucide-react'
import { useModalHistory } from '@/hooks/use-modal-history'

const STORAGE_KEY = 'dalant_admin_granted'
const MOCK_CODE = '0000' // 실제 구현에서는 서버 검증

export function AdminAccessButton({ marketId }: { marketId: string }) {
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code === MOCK_CODE) {
      localStorage.setItem(STORAGE_KEY, 'true')
      setIsAdmin(true)
      window.history.back() // 모달 닫기
      router.push(`/markets/${marketId}/admin/home`)
    } else {
      setError(true)
      setCode('')
    }
  }

  if (isAdmin) {
    return (
      <a
        href={`/markets/${marketId}/admin/home`}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-white py-3.5 text-sm font-semibold text-purple-600 transition-colors hover:bg-purple-50"
      >
        <ShieldCheck className="h-4 w-4" />
        관리자 화면
      </a>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-50"
      >
        <Lock className="h-4 w-4" />
        관리자 전환
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-5">
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="관리자에게 받은 코드 입력"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(false) }}
                  autoFocus
                  className={`w-full rounded-xl border px-4 py-3 text-center text-lg font-bold tracking-widest outline-none transition-colors ${
                    error
                      ? 'border-rose-400 bg-rose-50 text-rose-600'
                      : 'border-gray-200 focus:border-emerald-400'
                  }`}
                />
                {error && (
                  <p className="text-center text-xs text-rose-500">인증코드가 올바르지 않아요</p>
                )}
              </div>

              <button
                type="submit"
                disabled={code.length === 0}
                className="w-full rounded-full bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
              >
                확인
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
