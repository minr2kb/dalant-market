import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MOCK_MARKET, MOCK_PARTICIPANTS } from '@/lib/mock-data'
import { Calendar, Users } from 'lucide-react'

export default async function MarketJoinPage(props: PageProps<'/markets/[id]'>) {
  const { id } = await props.params
  const market = MOCK_MARKET

  const startDate = new Date(market.startsAt).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })
  const endDate = new Date(market.endsAt).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500">
            <span className="text-2xl font-bold text-white">D</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{market.title}</h1>
          {market.description && (
            <p className="text-sm text-gray-500">{market.description}</p>
          )}
        </div>

        <div className="rounded-2xl bg-gray-50 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <span>{startDate} ~ {endDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4 text-emerald-500" />
            <span>현재 {MOCK_PARTICIPANTS.length}명 참여 중</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link href={`/markets/${id}/home`}>
            <Button className="w-full rounded-full bg-emerald-500 py-3 text-base font-medium text-white hover:bg-emerald-600">
              마켓 참여하기
            </Button>
          </Link>
          <Link href="/login" className="flex justify-center text-sm text-gray-400 hover:text-gray-600">
            다른 계정으로 로그인
          </Link>
        </div>
      </div>
    </div>
  )
}
