import { MissionCard } from '@/components/MissionCard'
import { MOCK_MISSIONS } from '@/lib/mock-data'
import { getMissionStatus, type MissionStatus } from '@/types'

const STATUS_LABEL: Record<MissionStatus, string> = {
  active: '진행중',
  upcoming: '예정',
  past: '지남',
}

export default async function MissionsPage(props: PageProps<'/markets/[id]/missions'>) {
  const { id } = await props.params
  const searchParams = await props.searchParams
  const status = (searchParams?.status as MissionStatus) ?? 'active'

  const filtered = MOCK_MISSIONS.filter((m) => getMissionStatus(m) === status)

  const counts = {
    active: MOCK_MISSIONS.filter((m) => getMissionStatus(m) === 'active').length,
    upcoming: MOCK_MISSIONS.filter((m) => getMissionStatus(m) === 'upcoming').length,
    past: MOCK_MISSIONS.filter((m) => getMissionStatus(m) === 'past').length,
  }

  return (
    <div className="px-4 pt-14 pb-4 space-y-5 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900">미션</h1>

      <div className="flex gap-2">
        {(['active', 'upcoming', 'past'] as MissionStatus[]).map((s) => (
          <a
            key={s}
            href={`/markets/${id}/missions?status=${s}`}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              status === s
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {STATUS_LABEL[s]}
            <span
              className={`text-[11px] tabular-nums ${
                status === s ? 'opacity-80' : 'text-gray-400'
              }`}
            >
              {counts[s]}
            </span>
          </a>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            {status === 'active' && '진행중인 미션이 없어요'}
            {status === 'upcoming' && '예정된 미션이 없어요'}
            {status === 'past' && '지난 미션이 없어요'}
          </div>
        ) : (
          filtered.map((mission) => (
            <MissionCard key={mission.id} mission={mission} marketId={id} />
          ))
        )}
      </div>
    </div>
  )
}
