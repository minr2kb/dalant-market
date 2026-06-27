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
          filter: `market_id=eq.${marketId}`,
        },
        (payload) => {
          if ((payload.new as { user_id: string }).user_id !== userId) return
          queryClient.invalidateQueries({ queryKey: participantsQuery.$key })
          queryClient.invalidateQueries({ queryKey: missionsQuery.$key })
          queryClient.invalidateQueries({ queryKey: pointLogsQuery.$key })
          queryClient.invalidateQueries({ queryKey: ordersQuery.$key })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [marketId, userId, queryClient])
}
