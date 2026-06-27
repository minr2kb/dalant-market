import { Suspense } from 'react'
import { AdminHomeClient } from './AdminHomeClient'

function Skeleton() {
  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-8 w-20 animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />)}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />)}
      </div>
    </div>
  )
}

export default async function AdminHomePage(props: PageProps<'/markets/[id]/admin/home'>) {
  const { id: marketId } = await props.params
  return (
    <Suspense fallback={<Skeleton />}>
      <AdminHomeClient marketId={marketId} />
    </Suspense>
  )
}
