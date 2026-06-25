import Link from 'next/link'
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'
import { MOCK_CURRENT_USER, MOCK_MARKET, MOCK_POINT_LOGS } from '@/lib/mock-data'
import { PayQRButton } from '@/components/PayQRButton'

export default async function UserHomePage(props: PageProps<'/markets/[id]/home'>) {
  const { id } = await props.params
  const user = MOCK_CURRENT_USER
  const market = MOCK_MARKET
  const recentLogs = MOCK_POINT_LOGS.slice(0, 3)

  return (
    <div className="px-4 pt-14 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{market.title}</p>
          <h1 className="text-lg font-bold text-gray-900">{user.user.realName}</h1>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-3xl bg-emerald-500 p-6 text-white space-y-1">
          <p className="text-sm font-medium opacity-80">보유 {market.pointLabel}</p>
          <p className="text-4xl font-bold tabular-nums">{user.balance}</p>
          <p className="text-sm opacity-70">{market.pointLabel}</p>
        </div>
        <PayQRButton userName={user.user.realName} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">최근 내역</h2>
          <Link
            href={`/markets/${id}/history`}
            className="flex items-center gap-1 text-xs text-emerald-500"
          >
            전체 보기 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="divide-y divide-gray-50 rounded-2xl border border-gray-100 bg-white overflow-hidden">
          {recentLogs.map((log) => {
            const label =
              log.reasonType === 'mission'
                ? log.missionTitle
                : log.reasonType === 'purchase'
                ? log.itemName
                : log.memo ?? '수동 지급'

            const isPositive = log.amount > 0

            return (
              <div key={log.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isPositive ? 'bg-emerald-50' : 'bg-rose-50'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-rose-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-bold tabular-nums ${
                    isPositive ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {log.amount}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
