'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function JoinButton({ marketId }: { marketId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    setLoading(true)
    await fetch(`/api/markets/${marketId}/participants`, { method: 'POST' })
    router.push(`/markets/${marketId}/home`)
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
