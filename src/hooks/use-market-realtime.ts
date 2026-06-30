'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { participantsQuery, missionsQuery, pointLogsQuery, ordersQuery, marketsQuery } from '@/lib/query/queries'

export function useMarketRealtime(marketId: string, userId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    let mounted = true

    const setup = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !mounted) return

      supabase.realtime.setAuth(session.access_token)

      channel = supabase
        .channel(`balance-${marketId}-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'market_participants',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const row = payload.new as { market_id: string; user_id: string; balance: number }
            const old = payload.old as { balance: number }
            if (row.market_id !== marketId || row.user_id !== userId) return

            const diff = row.balance - (old.balance ?? 0)
            const cached = queryClient.getQueryData(marketsQuery.get({ marketId }).queryKey) as { data: { pointLabel: string } } | undefined
            const label = cached?.data.pointLabel ?? '달란트'
            if (diff > 0) toast.success(`${label} +${diff}`, { description: '잔액이 업데이트됐습니다.' })
            else if (diff < 0) toast.info(`${label} ${diff}`, { description: '잔액이 업데이트됐습니다.' })

            queryClient.invalidateQueries({ queryKey: participantsQuery.$key })
            queryClient.invalidateQueries({ queryKey: missionsQuery.$key })
            queryClient.invalidateQueries({ queryKey: pointLogsQuery.$key })
            queryClient.invalidateQueries({ queryKey: ordersQuery.$key })
          },
        )
        .subscribe((status, err) => {
          if (err) console.error('[Realtime] error:', err)
        })
    }

    setup()

    return () => {
      mounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [marketId, userId, queryClient])
}
