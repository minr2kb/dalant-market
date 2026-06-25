import { defineRouter, endpoint } from '@routar/core'
import { z } from 'zod'
import {
  MarketSchema,
  MarketParticipantSchema,
  MissionSchema,
  PointLogSchema,
  OrderSchema,
  OrderItemSchema,
  MarketItemSchema,
  listOf,
  oneOf,
} from './schemas'

const marketId = z.object({ marketId: z.string() })
const marketAndUser = z.object({ marketId: z.string(), userId: z.string() })
const marketAndMission = z.object({ marketId: z.string(), missionId: z.string() })

export const marketsRouter = defineRouter('/api/markets', {
  list: endpoint({
    method: 'GET',
    path: '/',
    response: listOf(MarketSchema),
  }),
  get: endpoint({
    method: 'GET',
    path: '/:marketId',
    request: { path: marketId },
    response: oneOf(MarketSchema),
  }),
})

export const participantsRouter = defineRouter('/api/markets', {
  list: endpoint({
    method: 'GET',
    path: '/:marketId/participants',
    request: { path: marketId },
    response: listOf(MarketParticipantSchema),
  }),
  get: endpoint({
    method: 'GET',
    path: '/:marketId/participants/:userId',
    request: { path: marketAndUser },
    response: oneOf(
      z.object({
        participant: MarketParticipantSchema,
        pointLogs: z.array(PointLogSchema),
        orders: z.array(OrderSchema),
      })
    ),
  }),
  adjustPoints: endpoint({
    method: 'PATCH',
    path: '/:marketId/participants/:userId/points',
    request: {
      path: marketAndUser,
      body: z.object({ amount: z.number(), memo: z.string().optional() }),
    },
    response: oneOf(
      z.object({
        userId: z.string(),
        amount: z.number(),
        newBalance: z.number(),
        memo: z.string().nullable(),
      })
    ),
  }),
})

export const missionsRouter = defineRouter('/api/markets', {
  list: endpoint({
    method: 'GET',
    path: '/:marketId/missions',
    request: {
      path: marketId,
      query: z.object({ status: z.enum(['active', 'upcoming', 'past']).optional() }),
    },
    response: listOf(MissionSchema),
  }),
  get: endpoint({
    method: 'GET',
    path: '/:marketId/missions/:missionId',
    request: { path: marketAndMission },
    response: oneOf(MissionSchema),
  }),
  verify: endpoint({
    method: 'POST',
    path: '/:marketId/missions/:missionId/verify',
    request: {
      path: marketAndMission,
      body: z.object({
        userId: z.string(),
        verifiedBy: z.string(),
        slot: z.number().optional(),
      }),
    },
    response: oneOf(
      z.object({
        missionId: z.string(),
        userId: z.string(),
        verifiedBy: z.string(),
        slot: z.number(),
        reward: z.number(),
        verifiedAt: z.string(),
      })
    ),
  }),
})

export const pointLogsRouter = defineRouter('/api/markets', {
  list: endpoint({
    method: 'GET',
    path: '/:marketId/point-logs',
    request: {
      path: marketId,
      query: z.object({ userId: z.string().optional() }),
    },
    response: listOf(PointLogSchema),
  }),
})

export const ordersRouter = defineRouter('/api/markets', {
  list: endpoint({
    method: 'GET',
    path: '/:marketId/orders',
    request: {
      path: marketId,
      query: z.object({ userId: z.string().optional() }),
    },
    response: listOf(OrderSchema),
  }),
  create: endpoint({
    method: 'POST',
    path: '/:marketId/orders',
    request: {
      path: marketId,
      body: z.object({
        userId: z.string(),
        verifiedBy: z.string(),
        items: z.array(OrderItemSchema),
      }),
    },
    response: oneOf(
      z.object({
        id: z.string(),
        marketId: z.string(),
        userId: z.string(),
        verifiedBy: z.string(),
        items: z.array(OrderItemSchema),
        total: z.number(),
        newBalance: z.number(),
        purchasedAt: z.string(),
      })
    ),
  }),
})

export const itemsRouter = defineRouter('/api/markets', {
  list: endpoint({
    method: 'GET',
    path: '/:marketId/items',
    request: { path: marketId },
    response: listOf(MarketItemSchema),
  }),
})

export const adminRouter = defineRouter('/api/markets', {
  auth: endpoint({
    method: 'POST',
    path: '/:marketId/admin/auth',
    request: {
      path: marketId,
      body: z.object({ code: z.string() }),
    },
    response: oneOf(z.object({ granted: z.boolean() })),
  }),
})
