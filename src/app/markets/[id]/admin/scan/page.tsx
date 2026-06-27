import { getCurrentUserId } from '@/lib/auth'
import { ScanContent } from './ScanContent'

export default async function ScanPage(props: PageProps<'/markets/[id]/admin/scan'>) {
  const { id: marketId } = await props.params
  const userId = await getCurrentUserId()
  return <ScanContent marketId={marketId} verifierUserId={userId ?? ''} />
}
