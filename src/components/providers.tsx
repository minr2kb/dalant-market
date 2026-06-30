'use client'
import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { routarQueryClient } from '@routar/react-query'
import { OverlayProvider } from 'overlay-kit'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() =>
    routarQueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } })
  )
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <OverlayProvider>{children}</OverlayProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
