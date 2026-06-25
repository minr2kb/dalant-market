import { FloatingTabBar } from '@/components/FloatingTabBar'
import { Home, QrCode, Wallet, ListTodo, Users } from 'lucide-react'

export default async function AdminLayout(props: LayoutProps<'/markets/[id]/admin'>) {
  const { id } = await props.params

  const tabs = [
    { label: '홈', segment: 'home', href: `/markets/${id}/admin/home`, icon: Home },
    { label: '스캔', segment: 'scan', href: `/markets/${id}/admin/scan`, icon: QrCode },
    { label: '달란트', segment: 'points', href: `/markets/${id}/admin/points`, icon: Wallet },
    { label: '미션', segment: 'missions', href: `/markets/${id}/admin/missions`, icon: ListTodo },
    { label: '유저', segment: 'users', href: `/markets/${id}/admin/users`, icon: Users },
  ]

  return (
    <div className="min-h-svh bg-white">
      <main className="pb-28">{props.children}</main>
      <FloatingTabBar tabs={tabs} />
    </div>
  )
}
