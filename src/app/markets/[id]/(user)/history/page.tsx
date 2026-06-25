import { PointLogItem } from '@/components/PointLogItem'
import { MOCK_POINT_LOGS, MOCK_CURRENT_USER, MOCK_MARKET } from '@/lib/mock-data'

export default async function HistoryPage(props: PageProps<'/markets/[id]/history'>) {
  await props.params
  const balance = MOCK_CURRENT_USER.balance
  const market = MOCK_MARKET

  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-5">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-gray-900">달란트 내역</h1>
        <span className="text-sm text-gray-500">
          잔액{' '}
          <span className="font-bold text-emerald-500">
            {balance} {market.pointLabel}
          </span>
        </span>
      </div>

      <div className="divide-y divide-gray-50">
        {MOCK_POINT_LOGS.map((log) => (
          <PointLogItem key={log.id} log={log} />
        ))}
      </div>
    </div>
  )
}
