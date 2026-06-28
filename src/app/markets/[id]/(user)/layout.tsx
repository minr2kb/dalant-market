import { FloatingTabBar } from '@/components/FloatingTabBar'
import { MarketRealtimeProvider } from '@/components/MarketRealtimeProvider'
import { getCurrentUserId } from '@/lib/auth'

export default async function UserLayout(props: LayoutProps<'/markets/[id]'>) {
  const { id } = await props.params
  const userId = await getCurrentUserId()

  const tabs = [
    { label: '홈', segment: 'home', href: `/markets/${id}/home`, icon: 'Home' },
    { label: '미션', segment: 'missions', href: `/markets/${id}/missions`, icon: 'ListTodo' },
    { label: '내역', segment: 'history', href: `/markets/${id}/history`, icon: 'History' },
  ]

  return (
    <div className="min-h-svh bg-gray-50">
      <MarketRealtimeProvider marketId={id} userId={userId ?? ''} />
      <main className="min-h-svh pb-28 pt-4">{props.children}</main>
      <FloatingTabBar tabs={tabs} />
    </div>
  )
}
