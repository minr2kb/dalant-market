import { cache } from 'react'
import { isServer } from '@tanstack/react-query'
import { routarQueryClient } from '@routar/react-query'

function makeQueryClient() {
  return routarQueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  })
}

let browserQC: ReturnType<typeof makeQueryClient> | undefined

// On the server, use React cache() so the same QueryClient is reused
// across the entire request (server components + HydrationBoundary).
const getServerQueryClient = cache(makeQueryClient)

export function getQueryClient() {
  if (isServer) return getServerQueryClient()
  return (browserQC ??= makeQueryClient())
}
