'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function JoinButton({ marketId }: { marketId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [conflict, setConflict] = useState<string | null>(null)

  async function handleJoin() {
    setLoading(true)
    const res = await fetch(`/api/markets/${marketId}/participants`, { method: 'POST' })
    const json = await res.json()
    const data = json?.data
    if (data?.hasConflict && data?.displayName) {
      setConflict(data.displayName)
      setLoading(false)
      return
    }
    router.push(`/markets/${marketId}/home`)
  }

  if (conflict) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5 text-center space-y-1.5">
          <p className="text-sm font-semibold text-amber-800">이 마켓에 동명이인이 있어요</p>
          <p className="text-sm text-amber-700">
            <span className="font-bold">{conflict}</span>로 입장합니다
          </p>
        </div>
        <Button
          onClick={() => router.push(`/markets/${marketId}/home`)}
          className="w-full h-12 rounded-full bg-emerald-500 text-base font-medium text-white hover:bg-emerald-600"
        >
          확인하고 입장하기
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleJoin}
      disabled={loading}
      className="w-full h-12 rounded-full bg-emerald-500 text-base font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
    >
      {loading ? '입장 중…' : '마켓 참여하기'}
    </Button>
  )
}
