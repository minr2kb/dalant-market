import Link from 'next/link'
import { QrCode, Coins, User } from 'lucide-react'
import { MOCK_MARKET, MOCK_PARTICIPANTS } from '@/lib/mock-data'

export default async function AdminHomePage(props: PageProps<'/markets/[id]/admin/home'>) {
  const { id } = await props.params
  const sorted = [...MOCK_PARTICIPANTS].sort((a, b) => b.balance - a.balance)

  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">관리자</p>
          <h1 className="text-xl font-bold text-gray-900">{MOCK_MARKET.title}</h1>
        </div>
        <Link
          href={`/markets/${id}/home`}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
        >
          <User className="h-3.5 w-3.5" />
          유저 화면
        </Link>
      </div>

      {/* 주요 액션 */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/markets/${id}/admin/scan`}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-6 text-white shadow-lg shadow-emerald-200 transition-transform active:scale-95"
        >
          <QrCode className="h-8 w-8" />
          <span className="text-sm font-bold">QR 스캔</span>
        </Link>
        <Link
          href={`/markets/${id}/admin/points`}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-purple-500 py-6 text-white shadow-lg shadow-purple-200 transition-transform active:scale-95"
        >
          <Coins className="h-8 w-8" />
          <span className="text-sm font-bold">달란트 지급</span>
        </Link>
      </div>

      {/* 참여자 현황 */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">참여자 달란트 현황</h2>
        <div className="overflow-hidden rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3 text-right">잔액</th>
                <th className="px-4 py-3 text-right">역할</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.user.realName}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-500">
                    {p.balance}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.role === 'admin' ? (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
                        관리자
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">유저</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
