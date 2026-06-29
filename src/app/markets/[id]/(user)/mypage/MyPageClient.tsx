'use client'

import { useRouter } from 'next/navigation'
import { useSuspenseQueries } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { marketsQuery, participantsQuery } from '@/lib/query/queries'

export function MyPageClient({ marketId, userId }: { marketId: string; userId: string }) {
  const router = useRouter()

  const [{ data: marketData }, { data: participantData }] = useSuspenseQueries({
    queries: [
      marketsQuery.get({ marketId }),
      participantsQuery.get({ marketId, userId }),
    ],
  })

  const market = marketData.data
  const { participant } = participantData.data
  const user = participant.user

  const genderLabel = user.gender === 'male' ? '남성' : '여성'
  const birthLabel = user.birthDate
    ? new Date(user.birthDate).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="px-4 space-y-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>

      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden divide-y divide-gray-50">
        <InfoRow label="활동명" value={participant.displayName} />
        <InfoRow label="본명" value={user.realName} />
        <InfoRow label="생년월일" value={birthLabel} />
        <InfoRow label="성별" value={genderLabel} />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden divide-y divide-gray-50">
        <InfoRow label="마켓" value={market.title} />
        <InfoRow label="보유 달란트" value={`${participant.balance} ${market.pointLabel}`} highlight />
      </div>

      <Button
        variant="outline"
        className="h-12 w-full gap-2 text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        로그아웃
      </Button>
    </div>
  )
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-emerald-600' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}
