import { MissionList } from '@/components/MissionList'
import { MOCK_MISSIONS } from '@/lib/mock-data'

export default async function MissionsPage(props: PageProps<'/markets/[id]/missions'>) {
  const { id } = await props.params

  return (
    <div className="px-4 pt-14 pb-4 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">미션</h1>
      <MissionList missions={MOCK_MISSIONS} marketId={id} />
    </div>
  )
}
