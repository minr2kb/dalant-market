import { MarketCard } from '@/components/MarketCard'
import { MOCK_MARKET, MOCK_PARTICIPANTS } from '@/lib/mock-data'

export default function MarketsPage() {
  return (
    <div className="min-h-svh bg-gray-50 px-4 pt-14 pb-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900">마켓</h1>
          <p className="text-sm text-gray-500">참여 가능한 행사를 선택하세요</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            참여 중인 마켓
          </h2>
          <MarketCard
            market={MOCK_MARKET}
            participantCount={MOCK_PARTICIPANTS.length}
            isJoined={true}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            참여 가능한 마켓
          </h2>
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-400">다른 활성 마켓이 없어요</p>
            <p className="mt-1 text-xs text-gray-400">QR 코드를 스캔해서 참여할 수 있어요</p>
          </div>
        </section>
      </div>
    </div>
  )
}
