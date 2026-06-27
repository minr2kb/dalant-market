'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { participantsQuery, missionsQuery, pointLogsQuery, ordersQuery } from '@/lib/query/queries'

export function useMarketRealtime(marketId: string, userId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`balance-${marketId}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'market_participants',
        },
        (payload) => {
          const row = payload.new as { market_id: string; user_id: string }
          if (row.market_id !== marketId || row.user_id !== userId) return
          queryClient.invalidateQueries({ queryKey: participantsQuery.$key })
          queryClient.invalidateQueries({ queryKey: missionsQuery.$key })
          queryClient.invalidateQueries({ queryKey: pointLogsQuery.$key })
          queryClient.invalidateQueries({ queryKey: ordersQuery.$key })
        },
      )
      .subscribe((status, err) => {
        if (err) console.error('[Realtime] error:', err)
        else console.log('[Realtime] status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [marketId, userId, queryClient])
}
