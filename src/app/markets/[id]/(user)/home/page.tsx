import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { UserHomeClient } from './UserHomeClient'

function Skeleton() {
  return (
    <div className="px-4 pt-14 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3.5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-7 w-32 animate-pulse rounded-lg bg-gray-100" />
        </div>
        <div className="h-8 w-16 animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="h-36 animate-pulse rounded-3xl bg-emerald-100" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-gray-100" />)}
      </div>
    </div>
  )
}

export default async function UserHomePage(props: PageProps<'/markets/[id]/home'>) {
  const { id: marketId } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  await supabase
    .from('market_participants')
    .upsert(
      { market_id: marketId, user_id: user.id, role: 'user', balance: 0 },
      { onConflict: 'market_id,user_id', ignoreDuplicates: true },
    )

  return (
    <Suspense fallback={<Skeleton />}>
      <UserHomeClient marketId={marketId} userId={user.id} />
    </Suspense>
  )
}
