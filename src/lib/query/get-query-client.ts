import { isServer } from '@tanstack/react-query'
import { routarQueryClient } from '@routar/react-query'

function makeQueryClient() {
  return routarQueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  })
}

let browserQC: ReturnType<typeof makeQueryClient> | undefined

export function getQueryClient() {
  if (isServer) return makeQueryClient()
  return (browserQC ??= makeQueryClient())
}
