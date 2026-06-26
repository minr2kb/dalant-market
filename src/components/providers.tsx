'use client'
import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { routarQueryClient } from '@routar/react-query'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() =>
    routarQueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } })
  )
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
