import Link from 'next/link'
import { Search } from 'lucide-react'
import { MOCK_PARTICIPANTS, MOCK_MISSIONS } from '@/lib/mock-data'

export default async function AdminUsersPage(props: PageProps<'/markets/[id]/admin/users'>) {
  const { id } = await props.params
  const sorted = [...MOCK_PARTICIPANTS].sort((a, b) => b.balance - a.balance)

  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">유저 관리</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="이름으로 검색"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-emerald-400"
        />
      </div>

      <div className="space-y-2">
        {sorted.map((p) => {
          const completedCount = MOCK_MISSIONS.filter((m) =>
            m.slots?.some((s) => s.verifiedAt !== null),
          ).length

          return (
            <Link
              key={p.id}
              href={`/markets/${id}/admin/users/${p.user.id}`}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                  {p.user.realName.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{p.user.realName}</p>
                    {p.role === 'admin' && (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-600">
                        관리자
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">미션 {completedCount}개 완료</p>
                </div>
              </div>
              <span className="text-base font-bold tabular-nums text-emerald-500">
                {p.balance}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
