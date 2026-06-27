'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { participantsQuery } from '@/lib/query/queries'

export function AdminUsersClient({ marketId }: { marketId: string }) {
  const { data } = useSuspenseQuery(participantsQuery.list({ marketId }))
  const sorted = [...data.data].sort((a, b) => b.balance - a.balance)

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input type="search" placeholder="이름으로 검색" className="rounded-xl pl-9" />
      </div>

      <div className="space-y-2">
        {sorted.map((p) => (
          <Link
            key={p.id}
            href={`/markets/${marketId}/admin/users/${p.user.id}`}
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
              </div>
            </div>
            <span className="text-base font-bold tabular-nums text-emerald-500">{p.balance}</span>
          </Link>
        ))}
      </div>
    </>
  )
}
