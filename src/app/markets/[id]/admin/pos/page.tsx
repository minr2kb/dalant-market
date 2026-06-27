import { getCurrentUserId } from '@/lib/auth'
import { PosContent } from './PosContent'

export default async function PosPage(props: PageProps<'/markets/[id]/admin/pos'>) {
  const { id: marketId } = await props.params
  const userId = await getCurrentUserId()
  return <PosContent marketId={marketId} verifierUserId={userId ?? ''} />
}
