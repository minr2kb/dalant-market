import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PointLogItem } from '@/components/PointLogItem'
import { MOCK_PARTICIPANTS, MOCK_POINT_LOGS, MOCK_MISSIONS } from '@/lib/mock-data'

export default async function AdminUserDetailPage(
  props: PageProps<'/markets/[id]/admin/users/[userId]'>,
) {
  const { id, userId } = await props.params
  const participant =
    MOCK_PARTICIPANTS.find((p) => p.user.id === userId) ?? MOCK_PARTICIPANTS[0]
  const userLogs = MOCK_POINT_LOGS.filter((l) => l.userId === participant.user.id)
  const completedMissions = MOCK_MISSIONS.filter((m) =>
    m.slots?.some((s) => s.verifiedAt !== null),
  )

  return (
    <div className="min-h-svh bg-white">
      <div className="flex items-center gap-3 px-4 pt-14 pb-4">
        <Link href={`/markets/${id}/admin/users`} className="text-gray-400">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{participant.user.realName}</h1>
        {participant.role === 'admin' && (
          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-600">
            관리자
          </span>
        )}
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-emerald-50 p-4 space-y-1">
            <p className="text-xs font-medium text-emerald-600">달란트 잔액</p>
            <p className="text-2xl font-bold tabular-nums text-emerald-700">
              {participant.balance}
            </p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 space-y-1">
            <p className="text-xs font-medium text-gray-500">미션 완료</p>
            <p className="text-2xl font-bold tabular-nums text-gray-700">
              {completedMissions.length}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">달란트 내역</h2>
          <div className="divide-y divide-gray-50 rounded-2xl border border-gray-100 bg-white px-4">
            {userLogs.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">내역이 없어요</p>
            ) : (
              userLogs.map((log) => <PointLogItem key={log.id} log={log} />)
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">미션 현황</h2>
          <div className="space-y-2">
            {MOCK_MISSIONS.map((m) => {
              const done = m.slots?.filter((s) => s.verifiedAt !== null).length ?? 0
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3"
                >
                  <span className="text-sm text-gray-700">{m.title}</span>
                  <span className="text-xs font-medium text-gray-400">
                    {done}/{m.limitCount}회
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
