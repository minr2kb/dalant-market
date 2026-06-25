import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import {
  MOCK_MARKET,
  MOCK_PARTICIPANTS,
  MOCK_MISSIONS,
  MOCK_POINT_LOGS,
  MOCK_ORDERS,
  MOCK_MARKET_ITEMS,
} from '@/lib/mock-data'
import { getMissionStatus } from '@/types'

export const runtime = 'edge'

const app = new Hono().basePath('/api')

// ── Markets ───────────────────────────────────────────────────────────────────

app.get('/markets', (c) => {
  return c.json({ data: [MOCK_MARKET] })
})

app.get('/markets/:id', (c) => {
  const { id } = c.req.param()
  if (id !== MOCK_MARKET.id) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: MOCK_MARKET })
})

// ── Participants ───────────────────────────────────────────────────────────────

app.get('/markets/:id/participants', (c) => {
  return c.json({ data: MOCK_PARTICIPANTS })
})

app.get('/markets/:id/participants/:userId', (c) => {
  const { userId } = c.req.param()
  const participant = MOCK_PARTICIPANTS.find((p) => p.user.id === userId)
  if (!participant) return c.json({ error: 'Not found' }, 404)

  const pointLogs = MOCK_POINT_LOGS.filter((l) => l.userId === userId)
  const orders = MOCK_ORDERS.filter((o) => o.userId === userId)

  return c.json({ data: { participant, pointLogs, orders } })
})

app.patch('/markets/:id/participants/:userId/points', async (c) => {
  const { userId } = c.req.param()
  const body = await c.req.json<{ amount: number; memo?: string }>()

  const participant = MOCK_PARTICIPANTS.find((p) => p.user.id === userId)
  if (!participant) return c.json({ error: 'Not found' }, 404)
  if (typeof body.amount !== 'number') return c.json({ error: 'amount required' }, 400)

  // mock: return projected balance
  return c.json({
    data: {
      userId,
      amount: body.amount,
      newBalance: participant.balance + body.amount,
      memo: body.memo ?? null,
    },
  })
})

// ── Missions ───────────────────────────────────────────────────────────────────

app.get('/markets/:id/missions', (c) => {
  const status = c.req.query('status') as 'active' | 'upcoming' | 'past' | undefined
  const missions = status
    ? MOCK_MISSIONS.filter((m) => getMissionStatus(m) === status)
    : MOCK_MISSIONS
  return c.json({ data: missions })
})

app.get('/markets/:id/missions/:missionId', (c) => {
  const { missionId } = c.req.param()
  const mission = MOCK_MISSIONS.find((m) => m.id === missionId)
  if (!mission) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: mission })
})

app.post('/markets/:id/missions/:missionId/verify', async (c) => {
  const { missionId } = c.req.param()
  const body = await c.req.json<{ userId: string; verifiedBy: string; slot?: number }>()

  const mission = MOCK_MISSIONS.find((m) => m.id === missionId)
  if (!mission) return c.json({ error: 'Mission not found' }, 404)
  if (body.userId === body.verifiedBy)
    return c.json({ error: 'Cannot verify own QR' }, 403)

  return c.json({
    data: {
      missionId,
      userId: body.userId,
      verifiedBy: body.verifiedBy,
      slot: body.slot ?? 1,
      reward: mission.reward,
      verifiedAt: new Date().toISOString(),
    },
  })
})

// ── Point logs ─────────────────────────────────────────────────────────────────

app.get('/markets/:id/point-logs', (c) => {
  const userId = c.req.query('userId')
  const logs = userId
    ? MOCK_POINT_LOGS.filter((l) => l.userId === userId)
    : MOCK_POINT_LOGS
  return c.json({ data: logs })
})

// ── Orders ─────────────────────────────────────────────────────────────────────

app.get('/markets/:id/orders', (c) => {
  const userId = c.req.query('userId')
  const orders = userId
    ? MOCK_ORDERS.filter((o) => o.userId === userId)
    : MOCK_ORDERS
  return c.json({ data: orders })
})

app.post('/markets/:id/orders', async (c) => {
  const body = await c.req.json<{
    userId: string
    verifiedBy: string
    items: Array<{ name: string; price: number; qty: number }>
  }>()

  const total = body.items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const participant = MOCK_PARTICIPANTS.find((p) => p.user.id === body.userId)
  if (!participant) return c.json({ error: 'User not found' }, 404)
  if (participant.balance < total)
    return c.json({ error: 'Insufficient balance' }, 422)

  return c.json({
    data: {
      id: `o_new_${Date.now()}`,
      marketId: MOCK_MARKET.id,
      userId: body.userId,
      verifiedBy: body.verifiedBy,
      items: body.items,
      total,
      newBalance: participant.balance - total,
      purchasedAt: new Date().toISOString(),
    },
  }, 201)
})

// ── Market items ───────────────────────────────────────────────────────────────

app.get('/markets/:id/items', (c) => {
  return c.json({ data: MOCK_MARKET_ITEMS })
})

// ── Admin auth ─────────────────────────────────────────────────────────────────

app.post('/markets/:id/admin/auth', async (c) => {
  const body = await c.req.json<{ code: string }>()
  // mock: accept '0000'
  if (body.code === '0000') {
    return c.json({ data: { granted: true } })
  }
  return c.json({ error: 'Invalid code' }, 403)
})

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
