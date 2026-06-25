import { ShoppingBag } from 'lucide-react'
import { MOCK_ORDERS, MOCK_MARKET } from '@/lib/mock-data'

export default async function PurchasesPage(props: PageProps<'/markets/[id]/purchases'>) {
  await props.params
  const market = MOCK_MARKET

  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">구매 내역</h1>

      <div className="space-y-3">
        {MOCK_ORDERS.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-400">
                  {new Date(order.purchasedAt).toLocaleString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <span className="text-sm font-bold text-rose-500 tabular-nums">
                -{order.total} {market.pointLabel}
              </span>
            </div>

            <div className="space-y-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.name} × {item.qty}
                  </span>
                  <span className="text-gray-500 tabular-nums">{item.price * item.qty}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-50 pt-2 text-right text-xs text-gray-400">
              {order.verifiedByName} 처리
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
