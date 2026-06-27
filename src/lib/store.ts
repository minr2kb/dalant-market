import type { Market, MarketParticipant, Mission, PointLog, Order, MarketItem } from '@/types'
import {
  MOCK_MARKET,
  MOCK_PARTICIPANTS,
  MOCK_MISSIONS,
  MOCK_POINT_LOGS,
  MOCK_ORDERS,
  MOCK_MARKET_ITEMS,
} from './mock-data'

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

interface AppStore {
  markets: Market[]
  participants: MarketParticipant[]
  missions: Mission[]
  pointLogs: PointLog[]
  orders: Order[]
  items: MarketItem[]
  _seq: number
}

declare global {
  // biome-ignore lint/style/noVar: globalThis persistence across hot-reloads
  var __dalantStore: AppStore | undefined
}

globalThis.__dalantStore ??= {
  markets: clone([MOCK_MARKET]),
  participants: clone(MOCK_PARTICIPANTS),
  missions: clone(MOCK_MISSIONS),
  pointLogs: clone(MOCK_POINT_LOGS),
  orders: clone(MOCK_ORDERS),
  items: clone(MOCK_MARKET_ITEMS),
  _seq: 100,
}

export const store = globalThis.__dalantStore

export function genId(): string {
  return String(store._seq++)
}
