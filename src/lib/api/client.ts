import { createApi, createFetchExecutor, dispatchExecutor, logger } from '@routar/core'
import {
  marketsRouter,
  participantsRouter,
  missionsRouter,
  pointLogsRouter,
  ordersRouter,
  itemsRouter,
  adminRouter,
} from './router'

const BASE_URL =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
    : window.location.origin

const serverExecutor = createFetchExecutor(`${BASE_URL}/api`, {
  plugins: [logger()],
  defaultHeaders: async () => {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ')
    return cookieHeader ? { Cookie: cookieHeader } : {}
  },
})
const clientExecutor = createFetchExecutor(`${BASE_URL}/api`, { plugins: [logger()] })

const executor = dispatchExecutor(() =>
  typeof window === 'undefined' ? serverExecutor : clientExecutor
)

export const marketsApi = createApi(executor, marketsRouter)
export const participantsApi = createApi(executor, participantsRouter)
export const missionsApi = createApi(executor, missionsRouter)
export const pointLogsApi = createApi(executor, pointLogsRouter)
export const ordersApi = createApi(executor, ordersRouter)
export const itemsApi = createApi(executor, itemsRouter)
export const adminApi = createApi(executor, adminRouter)
