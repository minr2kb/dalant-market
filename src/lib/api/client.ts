import { createApi, createFetchExecutor, dispatchExecutor } from '@routar/core'
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
    : ''

const serverExecutor = createFetchExecutor(BASE_URL)
const clientExecutor = createFetchExecutor('')

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
