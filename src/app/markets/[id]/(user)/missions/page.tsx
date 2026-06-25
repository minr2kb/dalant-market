import { MissionCard } from '@/components/MissionCard'
import { MOCK_MISSIONS } from '@/lib/mock-data'

type Period = '2weeks' | '1week' | 'retreat'

const PERIOD_LABEL: Record<Period, string> = {
  '2weeks': '2주 전',
  '1week': '1주 전',
  retreat: '수련회',
}

export default async function MissionsPage(props: PageProps<'/markets/[id]/missions'>) {
  const { id } = await props.params
  const searchParams = await props.searchParams
  const period = (searchParams?.period as Period) ?? 'retreat'

  const filtered = MOCK_MISSIONS.filter((m) => m.period === period)

  return (
    <div className="px-4 pt-14 pb-4 space-y-5 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900">미션</h1>

      <div className="flex gap-2">
        {(['2weeks', '1week', 'retreat'] as Period[]).map((p) => (
          <a
            key={p}
            href={`/markets/${id}/missions?period=${p}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              period === p
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {PERIOD_LABEL[p]}
          </a>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            이 구간에 미션이 없어요
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
