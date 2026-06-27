# TanStack Query + @routar/react-query 리팩토링 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 API 호출을 `@tanstack/react-query` + `@routar/react-query` 기반 `useSuspenseQuery` / `useMutation`으로 전환하고, 서버 컴포넌트에서 SSR prefetch를 적용한다.

**Architecture:** 서버 컴포넌트는 `getQueryClient()` + `prefetchQuery()` + `HydrationBoundary`로 초기 데이터를 hydrate하고, 클라이언트 컴포넌트는 `useSuspenseQuery`로 캐시에서 데이터를 읽는다. Mutation은 `useMutation` + `invalidates`로 캐시를 무효화한다.

**Tech Stack:** Next.js 16 App Router, `@tanstack/react-query@^5`, `@routar/react-query@1.8.0`, `@routar/core@1.8.0`, TypeScript, pnpm

## Global Constraints

- `flatten: true` — 모든 `createQueries` 호출에 적용, flat params 사용 (`{ marketId }` not `{ path: { marketId } }`)
- `staleTime: 60_000` — 기본 stale time
- `CURRENT_USER_ID = 'u1'` — 인증 구현 전 하드코딩 유지
- `pnpm` 사용 (`npm install` 금지)
- 검증: `pnpm build 2>&1 | tail -8` (타입 에러 + 빌드 에러 확인)
- lint: `pnpm lint`

---

## 파일 구조

**신규 파일:**
- `src/lib/query/get-query-client.ts` — 서버/클라이언트 QueryClient 싱글턴
- `src/lib/query/queries.ts` — 전 도메인 createQueries export
- `src/components/providers.tsx` — QueryClientProvider 래퍼
- `src/app/api/markets/[marketId]/items/[itemId]/route.ts` — 아이템 DELETE 핸들러
- `src/app/markets/[id]/(user)/home/UserHomeClient.tsx`
- `src/app/markets/[id]/(user)/missions/MissionListClient.tsx`
- `src/app/markets/[id]/(user)/history/HistoryClient.tsx`
- `src/app/markets/[id]/admin/home/AdminHomeClient.tsx`
- `src/app/markets/[id]/admin/users/AdminUsersClient.tsx`
- `src/app/markets/[id]/admin/users/[userId]/AdminUserDetailClient.tsx`

**수정 파일:**
- `src/lib/api/router.ts` — missionsRouter에 create/update/delete, itemsRouter에 create/delete 추가
- `src/app/layout.tsx` — Providers 래핑
- 12개 page.tsx 파일 — prefetch shell 또는 useSuspenseQuery 전환

**삭제 파일:**
- `src/lib/store.ts` (모든 참조 제거 후)

---

### Task 1: 패키지 설치 + 인프라 파일 생성

**Files:**
- Create: `src/lib/query/get-query-client.ts`
- Create: `src/lib/query/queries.ts`
- Create: `src/components/providers.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: `getQueryClient()` → `QueryClient`, `marketsQuery`, `participantsQuery`, `missionsQuery`, `pointLogsQuery`, `ordersQuery`, `itemsQuery`, `adminQuery`, `<Providers>`

- [ ] **Step 1: 패키지 설치**

```bash
pnpm add @tanstack/react-query @routar/react-query
```

- [ ] **Step 2: `src/lib/query/get-query-client.ts` 생성**

```ts
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
```

- [ ] **Step 3: `src/lib/query/queries.ts` 생성**

```ts
import { createQueries } from '@routar/react-query'
import {
  marketsApi,
  participantsApi,
  missionsApi,
  pointLogsApi,
  ordersApi,
  itemsApi,
  adminApi,
} from '@/lib/api/client'

export const marketsQuery      = createQueries(marketsApi,      { flatten: true })
export const participantsQuery = createQueries(participantsApi, { flatten: true })
export const missionsQuery     = createQueries(missionsApi,     { flatten: true })
export const pointLogsQuery    = createQueries(pointLogsApi,    { flatten: true })
export const ordersQuery       = createQueries(ordersApi,       { flatten: true })
export const itemsQuery        = createQueries(itemsApi,        { flatten: true })
export const adminQuery        = createQueries(adminApi,        { flatten: true })
```

- [ ] **Step 4: `src/components/providers.tsx` 생성**

```tsx
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
```

- [ ] **Step 5: `src/app/layout.tsx` 수정 — Providers 래핑**

현재 layout.tsx를 읽어 `<body>` 안의 내용을 `<Providers>`로 감싼다.

```tsx
import { Providers } from '@/components/providers'

// <body> 안:
<Providers>
  {children}
</Providers>
```

- [ ] **Step 6: 빌드 확인**

```bash
pnpm build 2>&1 | tail -8
```

에러가 없으면 진행. `@tanstack/react-query` 타입 에러가 나면 `pnpm add -D @types/...` 확인.

- [ ] **Step 7: 커밋**

```bash
git add src/lib/query/ src/components/providers.tsx src/app/layout.tsx
git commit -m "feat: add TanStack Query infra — QueryClient, queries factory, Providers"
```

---

### Task 2: router.ts — 누락 엔드포인트 추가 + items DELETE 라우트 생성

**Files:**
- Modify: `src/lib/api/router.ts`
- Create: `src/app/api/markets/[marketId]/items/[itemId]/route.ts`

**Interfaces:**
- Produces:
  - `missionsQuery.create` (mutation) — vars: `{ marketId, title, description?, reward, limitCount, type, isGroup, activeFrom, activeUntil }`
  - `missionsQuery.update` (mutation) — vars: `{ marketId, missionId, ...patch }`
  - `missionsQuery.delete` (mutation) — vars: `{ marketId, missionId }`
  - `itemsQuery.create` (mutation) — vars: `{ marketId, name, price }`
  - `itemsQuery.delete` (mutation) — vars: `{ marketId, itemId }`

- [ ] **Step 1: `src/lib/api/router.ts` — missionsRouter에 엔드포인트 추가**

`missionsRouter` 정의를 아래로 교체 (기존 `list`, `get`, `verify`는 유지):

```ts
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
  create: endpoint({
    method: 'POST',
    path: '/:marketId/missions',
    request: {
      path: marketId,
      body: z.object({
        title: z.string(),
        description: z.string().optional(),
        type: z.enum(['user_qr', 'upload', 'admin_qr', 'manual']),
        isGroup: z.boolean(),
        reward: z.number(),
        limitCount: z.number().nullable(),
        activeFrom: z.string().nullable(),
        activeUntil: z.string().nullable(),
      }),
    },
    response: oneOf(MissionSchema),
  }),
  update: endpoint({
    method: 'PATCH',
    path: '/:marketId/missions/:missionId',
    request: {
      path: marketAndMission,
      body: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        type: z.enum(['user_qr', 'upload', 'admin_qr', 'manual']).optional(),
        isGroup: z.boolean().optional(),
        reward: z.number().optional(),
        limitCount: z.number().nullable().optional(),
        activeFrom: z.string().nullable().optional(),
        activeUntil: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      }),
    },
    response: oneOf(MissionSchema),
  }),
  delete: endpoint({
    method: 'DELETE',
    path: '/:marketId/missions/:missionId',
    request: { path: marketAndMission },
    response: oneOf(z.object({ id: z.string() })),
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
```

- [ ] **Step 2: `src/lib/api/router.ts` — itemsRouter에 엔드포인트 추가**

```ts
const marketAndItem = z.object({ marketId: z.string(), itemId: z.string() })

export const itemsRouter = defineRouter('/api/markets', {
  list: endpoint({
    method: 'GET',
    path: '/:marketId/items',
    request: { path: marketId },
    response: listOf(MarketItemSchema),
  }),
  create: endpoint({
    method: 'POST',
    path: '/:marketId/items',
    request: {
      path: marketId,
      body: z.object({ name: z.string(), price: z.number() }),
    },
    response: oneOf(MarketItemSchema),
  }),
  delete: endpoint({
    method: 'DELETE',
    path: '/:marketId/items/:itemId',
    request: { path: marketAndItem },
    response: oneOf(z.object({ id: z.string() })),
  }),
})
```

`marketAndItem` 변수는 파일 상단 `marketAndMission` 옆에 추가.

- [ ] **Step 3: items DELETE API 라우트 핸들러 생성**

`src/app/api/markets/[marketId]/items/[itemId]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await props.params
  const idx = store.items.findIndex((i) => i.id === itemId)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  store.items.splice(idx, 1)
  return NextResponse.json({ data: { id: itemId } })
}
```

- [ ] **Step 4: 빌드 확인**

```bash
pnpm build 2>&1 | tail -8
```

- [ ] **Step 5: 커밋**

```bash
git add src/lib/api/router.ts src/app/api/markets/
git commit -m "feat: add create/update/delete endpoints to missionsRouter and itemsRouter"
```

---

### Task 3: 유저 홈 페이지

**Files:**
- Modify: `src/app/markets/[id]/(user)/home/page.tsx`
- Create: `src/app/markets/[id]/(user)/home/UserHomeClient.tsx`

**Interfaces:**
- Consumes: `marketsQuery.get`, `participantsQuery.get`, `pointLogsQuery.list`

- [ ] **Step 1: `UserHomeClient.tsx` 생성**

기존 `page.tsx`의 UI 로직을 클라이언트 컴포넌트로 이동:

```tsx
'use client'

import { useSuspenseQueries } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'
import { PayQRButton } from '@/components/PayQRButton'
import { AdminAccessButton } from '@/components/AdminAccessButton'
import { marketsQuery, participantsQuery, pointLogsQuery } from '@/lib/query/queries'

const CURRENT_USER_ID = 'u1'

export function UserHomeClient({ marketId }: { marketId: string }) {
  const [{ data: marketData }, { data: participantData }, { data: logsData }] =
    useSuspenseQueries({
      queries: [
        marketsQuery.get({ marketId }),
        participantsQuery.get({ marketId, userId: CURRENT_USER_ID }),
        pointLogsQuery.list({ marketId, userId: CURRENT_USER_ID }),
      ],
    })

  const market = marketData.data
  const user = participantData.data
  const recentLogs = logsData.data.slice(0, 3)

  return (
    <div className="px-4 pt-14 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">{market.title}</p>
          <h1 className="text-xl font-bold text-gray-900">{user.user.realName}</h1>
        </div>
        <AdminAccessButton marketId={marketId} compact />
      </div>

      <div className="rounded-3xl bg-emerald-500 p-6 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium opacity-80">보유 {market.pointLabel}</p>
            <p className="text-4xl font-bold tabular-nums">{user.balance}</p>
            <p className="text-sm opacity-70">{market.pointLabel}</p>
          </div>
          <PayQRButton marketId={marketId} userId={user.user.id} userName={user.user.realName} compact />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">최근 내역</h2>
          <Link href={`/markets/${marketId}/history`} className="flex items-center gap-1 text-xs text-emerald-500">
            전체 보기 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {recentLogs.map((log) => {
            const label =
              log.reasonType === 'mission' ? log.missionTitle :
              log.reasonType === 'purchase' ? log.itemName :
              log.memo ?? '수동 지급'
            const isPositive = log.amount > 0
            return (
              <div key={log.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isPositive ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    {isPositive ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-rose-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-bold tabular-nums ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isPositive ? '+' : ''}{log.amount}
                </span>
              </div>
            )
          })}
          {recentLogs.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">아직 내역이 없어요</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `page.tsx` → prefetch shell로 교체**

```tsx
import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/get-query-client'
import { marketsQuery, participantsQuery, pointLogsQuery } from '@/lib/query/queries'
import { UserHomeClient } from './UserHomeClient'

const CURRENT_USER_ID = 'u1'

export default async function UserHomePage(props: PageProps<'/markets/[id]/home'>) {
  const { id: marketId } = await props.params
  const qc = getQueryClient()
  await Promise.all([
    qc.prefetchQuery(marketsQuery.get({ marketId })),
    qc.prefetchQuery(participantsQuery.get({ marketId, userId: CURRENT_USER_ID })),
    qc.prefetchQuery(pointLogsQuery.list({ marketId, userId: CURRENT_USER_ID })),
  ])
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<p className="py-8 text-center text-sm text-gray-400">불러오는 중…</p>}>
        <UserHomeClient marketId={marketId} />
      </Suspense>
    </HydrationBoundary>
  )
}
```

- [ ] **Step 3: 빌드 확인**

```bash
pnpm build 2>&1 | tail -8
```

- [ ] **Step 4: 커밋**

```bash
git add src/app/markets/
git commit -m "feat: user home — prefetch + HydrationBoundary + useSuspenseQueries"
```

---

### Task 4: 유저 미션 목록 페이지

**Files:**
- Modify: `src/app/markets/[id]/(user)/missions/page.tsx`
- Create: `src/app/markets/[id]/(user)/missions/MissionListClient.tsx`

**Interfaces:**
- Consumes: `missionsQuery.list`
- Note: 기존 `<MissionList missions={...} marketId={...} />` 컴포넌트는 props를 그대로 받으므로 변경 불필요

- [ ] **Step 1: `MissionListClient.tsx` 생성**

```tsx
'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { MissionList } from '@/components/MissionList'
import { missionsQuery } from '@/lib/query/queries'

export function MissionListClient({ marketId }: { marketId: string }) {
  const { data } = useSuspenseQuery(missionsQuery.list({ marketId }))
  return <MissionList missions={data.data} marketId={marketId} />
}
```

- [ ] **Step 2: `page.tsx` 교체**

```tsx
import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/get-query-client'
import { missionsQuery } from '@/lib/query/queries'
import { MissionListClient } from './MissionListClient'

export default async function MissionsPage(props: PageProps<'/markets/[id]/missions'>) {
  const { id: marketId } = await props.params
  const qc = getQueryClient()
  await qc.prefetchQuery(missionsQuery.list({ marketId }))
  return (
    <div className="px-4 pt-14 pb-4 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">미션</h1>
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense fallback={<p className="py-8 text-center text-sm text-gray-400">불러오는 중…</p>}>
          <MissionListClient marketId={marketId} />
        </Suspense>
      </HydrationBoundary>
    </div>
  )
}
```

- [ ] **Step 3: 빌드 + 커밋**

```bash
pnpm build 2>&1 | tail -8
git add src/app/markets/
git commit -m "feat: user missions list — prefetch + useSuspenseQuery"
```

---

### Task 5: 유저 미션 상세 페이지

**Files:**
- Modify: `src/app/markets/[id]/(user)/missions/[missionId]/page.tsx`

**Interfaces:**
- Consumes: `missionsQuery.get`, `participantsQuery.list`, `missionsQuery.verify`

- [ ] **Step 1: page.tsx 전체 교체**

`useEffect + fetch` 제거, `useSuspenseQuery` + `useMutation` 적용:

```tsx
'use client'

import { use } from 'react'
import { useState } from 'react'
import { useSuspenseQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Upload, CheckCircle2, ScanLine } from 'lucide-react'
import Link from 'next/link'
import { MissionSlot } from '@/components/MissionSlot'
import { QRModal } from '@/components/QRModal'
import { QRScanner } from '@/components/QRScanner'
import { Button } from '@/components/ui/button'
import { parseQR } from '@/lib/qr'
import { getMissionStatus } from '@/types'
import type { MarketParticipant } from '@/types'
import { missionsQuery, participantsQuery } from '@/lib/query/queries'

const CURRENT_USER_ID = 'u1'

const TYPE_LABEL: Record<string, string> = {
  user_qr: '유저 간 인증',
  upload: '업로드형',
  admin_qr: '관리자 인증',
  manual: '상시',
}

export default function MissionDetailPage(props: PageProps<'/markets/[id]/missions/[missionId]'>) {
  const { id: marketId, missionId } = use(props.params)
  const qc = useQueryClient()

  const [photoUploaded, setPhotoUploaded] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanTarget, setScanTarget] = useState<MarketParticipant | null>(null)
  const [scanDone, setScanDone] = useState(false)

  const [{ data: missionData }, { data: participantsData }] = useSuspenseQueries({
    queries: [
      missionsQuery.get({ marketId, missionId }),
      participantsQuery.list({ marketId }),
    ],
  })

  const mission = missionData.data
  const participants = participantsData.data.filter((p) => p.user.id !== CURRENT_USER_ID)

  const verifyMutation = useMutation(
    missionsQuery.verify({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: missionsQuery.get.queryKey({ marketId, missionId }) })
      },
    })
  )

  function handleScan(val: string) {
    const qr = parseQR(val)
    let target: MarketParticipant | undefined
    if (qr?.type === 'mission') {
      target = participants.find((p) => p.user.id === qr.userId)
    }
    setScanTarget(target ?? participants[0] ?? null)
  }

  async function verifyScanned() {
    if (!scanTarget) return
    await verifyMutation.mutateAsync({ marketId, missionId, userId: scanTarget.user.id, verifiedBy: CURRENT_USER_ID })
    setScanDone(true)
  }

  function closeScannerAfterDone() {
    setScannerOpen(false)
    setScanTarget(null)
    setScanDone(false)
  }

  const nextPendingSlot = mission.slots?.find((s) => s.verifiedAt === null)
  const isPast = getMissionStatus(mission) === 'past'
  const isUserDone = !nextPendingSlot && (mission.slots?.length ?? 0) > 0
  const isLocked = isPast || isUserDone

  return (
    <>
      <div>
        <div className="flex items-center gap-3 px-4 pt-14 pb-4 max-w-lg mx-auto">
          <Link href={`/markets/${marketId}/missions`} className="text-gray-400">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">{mission.title}</h1>
        </div>

        <div className="px-4 max-w-lg mx-auto space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{TYPE_LABEL[mission.type]}</span>
              <span className="text-lg font-bold text-emerald-500">+{mission.reward} 달란트</span>
            </div>
            {mission.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{mission.description}</p>
            )}
            {mission.isGroup && (
              <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                단체 미션
              </span>
            )}
          </div>

          {isLocked ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-center space-y-1.5">
              <CheckCircle2 className="mx-auto h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                {isPast ? '기간이 종료된 미션이에요' : '이미 완료한 미션이에요'}
              </p>
            </div>
          ) : mission.type === 'manual' ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center space-y-2">
              <CheckCircle2 className="mx-auto h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">관리자가 수동으로 지급하는 상시 미션이에요</p>
              <p className="text-xs text-gray-400">별도 인증 없이 관리자가 직접 달란트를 지급합니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mission.type === 'upload' && (
                <button
                  type="button"
                  onClick={() => setPhotoUploaded(true)}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-6 text-sm font-medium transition-colors ${
                    photoUploaded
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                      : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {photoUploaded ? (
                    <><CheckCircle2 className="h-5 w-5" /> 사진 업로드 완료</>
                  ) : (
                    <><Upload className="h-5 w-5" /> 사진 업로드</>
                  )}
                </button>
              )}
              {nextPendingSlot && (
                <QRModal
                  marketId={marketId}
                  missionId={missionId}
                  userId={CURRENT_USER_ID}
                  missionTitle={mission.title}
                  disabled={mission.type === 'upload' && !photoUploaded}
                />
              )}
              {mission.type === 'user_qr' && (
                <Button
                  onClick={() => { setScanTarget(null); setScanDone(false); setScannerOpen(true) }}
                  variant="outline"
                  className="h-12 w-full rounded-full border-emerald-200 text-emerald-600 text-sm font-semibold hover:bg-emerald-50"
                >
                  <ScanLine className="mr-2 h-4 w-4" />
                  QR 인증해주기
                </Button>
              )}
              {mission.type === 'upload' && !photoUploaded && (
                <p className="text-center text-xs text-gray-400">사진을 업로드해야 QR을 생성할 수 있어요</p>
              )}
              {mission.type === 'admin_qr' && (
                <p className="text-center text-xs text-gray-400">관리자에게 직접 가서 이 QR을 보여주세요</p>
              )}
              {mission.type === 'user_qr' && (
                <p className="text-center text-xs text-gray-400">내 QR을 보여주거나, 상대방의 QR을 직접 찍어줄 수 있어요</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">인증 현황</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {mission.slots?.map((slot) => (
                <MissionSlot key={slot.slot} slot={slot} slotNumber={slot.slot} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <QRScanner
        open={scannerOpen}
        title={`${mission.title} — 상대방 QR 스캔`}
        hint="상대방의 QR을 화면 중앙에 맞춰주세요"
        onScan={handleScan}
        onSimulate={() => setScanTarget(participants[0] ?? null)}
        onClose={() => { setScannerOpen(false); setScanTarget(null); setScanDone(false) }}
      >
        {scanTarget && !scanDone && (
          <div className="flex flex-1 flex-col justify-end">
            <div className="rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-5">
              <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-base font-bold text-emerald-600">
                  {scanTarget.user.realName[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{scanTarget.user.realName}님의 QR</p>
                  <p className="text-sm text-gray-500">미션 인증 시 +{mission.reward} 달란트 적립</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setScanTarget(null)} className="h-12 flex-1 rounded-full text-sm font-semibold">
                  다시 스캔
                </Button>
                <Button onClick={verifyScanned} className="h-12 flex-1 rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600">
                  인증하기
                </Button>
              </div>
            </div>
          </div>
        )}
        {scanDone && scanTarget && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <CheckCircle2 className="h-20 w-20 text-emerald-400" />
            <div>
              <p className="text-xl font-bold text-white">인증 완료!</p>
              <p className="mt-1 text-sm text-white/60">{scanTarget.user.realName}님 · +{mission.reward} 달란트 적립됨</p>
            </div>
            <Button onClick={closeScannerAfterDone} className="mt-4 h-12 w-full max-w-xs rounded-full bg-white text-sm font-semibold text-gray-900 hover:bg-white/90">
              확인
            </Button>
          </div>
        )}
      </QRScanner>
    </>
  )
}
```

- [ ] **Step 2: 빌드 + 커밋**

```bash
pnpm build 2>&1 | tail -8
git add src/app/markets/
git commit -m "feat: mission detail — useSuspenseQueries + useMutation(verify)"
```

---

### Task 6: 유저 달란트 내역 페이지

**Files:**
- Modify: `src/app/markets/[id]/(user)/history/page.tsx`
- Create: `src/app/markets/[id]/(user)/history/HistoryClient.tsx`

**Interfaces:**
- Consumes: `marketsQuery.get`, `participantsQuery.get`, `pointLogsQuery.list`, `ordersQuery.list`

- [ ] **Step 1: `HistoryClient.tsx` 생성**

```tsx
'use client'

import { useSuspenseQueries } from '@tanstack/react-query'
import { PointLogItem } from '@/components/PointLogItem'
import { marketsQuery, participantsQuery, pointLogsQuery, ordersQuery } from '@/lib/query/queries'

const CURRENT_USER_ID = 'u1'

export function HistoryClient({ marketId }: { marketId: string }) {
  const [{ data: marketData }, { data: participantData }, { data: logsData }, { data: ordersData }] =
    useSuspenseQueries({
      queries: [
        marketsQuery.get({ marketId }),
        participantsQuery.get({ marketId, userId: CURRENT_USER_ID }),
        pointLogsQuery.list({ marketId, userId: CURRENT_USER_ID }),
        ordersQuery.list({ marketId, userId: CURRENT_USER_ID }),
      ],
    })

  const market = marketData.data
  const user = participantData.data
  const logs = logsData.data
  const orderMap = Object.fromEntries(ordersData.data.map((o) => [o.id, o]))

  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-5">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-gray-900">달란트 내역</h1>
        <span className="text-sm text-gray-500">
          잔액 <span className="font-bold text-emerald-500">{user.balance} {market.pointLabel}</span>
        </span>
      </div>
      <div className="space-y-3">
        {logs.map((log) => (
          <PointLogItem key={log.id} log={log} order={log.orderId ? orderMap[log.orderId] : undefined} />
        ))}
        {logs.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">아직 내역이 없어요</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `page.tsx` 교체**

```tsx
import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/get-query-client'
import { marketsQuery, participantsQuery, pointLogsQuery, ordersQuery } from '@/lib/query/queries'
import { HistoryClient } from './HistoryClient'

const CURRENT_USER_ID = 'u1'

export default async function HistoryPage(props: PageProps<'/markets/[id]/history'>) {
  const { id: marketId } = await props.params
  const qc = getQueryClient()
  await Promise.all([
    qc.prefetchQuery(marketsQuery.get({ marketId })),
    qc.prefetchQuery(participantsQuery.get({ marketId, userId: CURRENT_USER_ID })),
    qc.prefetchQuery(pointLogsQuery.list({ marketId, userId: CURRENT_USER_ID })),
    qc.prefetchQuery(ordersQuery.list({ marketId, userId: CURRENT_USER_ID })),
  ])
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<p className="py-8 text-center text-sm text-gray-400">불러오는 중…</p>}>
        <HistoryClient marketId={marketId} />
      </Suspense>
    </HydrationBoundary>
  )
}
```

- [ ] **Step 3: 빌드 + 커밋**

```bash
pnpm build 2>&1 | tail -8
git add src/app/markets/
git commit -m "feat: history page — prefetch + useSuspenseQueries"
```

---

### Task 7: 어드민 홈 페이지

**Files:**
- Modify: `src/app/markets/[id]/admin/home/page.tsx`
- Create: `src/app/markets/[id]/admin/home/AdminHomeClient.tsx`

**Interfaces:**
- Consumes: `marketsQuery.get`, `participantsQuery.list`, `missionsQuery.list`, `pointLogsQuery.list`

- [ ] **Step 1: `AdminHomeClient.tsx` 생성**

```tsx
'use client'

import Link from 'next/link'
import { useSuspenseQueries } from '@tanstack/react-query'
import { ScanLine, Coins, ShoppingBag, User, TrendingUp, TrendingDown, Gift } from 'lucide-react'
import { getMissionStatus } from '@/types'
import { marketsQuery, participantsQuery, missionsQuery, pointLogsQuery } from '@/lib/query/queries'

export function AdminHomeClient({ marketId }: { marketId: string }) {
  const [{ data: marketData }, { data: participantsData }, { data: missionsData }, { data: logsData }] =
    useSuspenseQueries({
      queries: [
        marketsQuery.get({ marketId }),
        participantsQuery.list({ marketId }),
        missionsQuery.list({ marketId }),
        pointLogsQuery.list({ marketId }),
      ],
    })

  const market = marketData.data
  const participants = participantsData.data
  const missions = missionsData.data
  const logs = logsData.data

  const activeMissions = missions.filter((m) => getMissionStatus(m) === 'active').length
  const totalGranted = logs.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0)
  const totalSpent = logs.filter((l) => l.amount < 0).reduce((s, l) => s + Math.abs(l.amount), 0)
  const recentLogs = [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">{market.title}</h1>
          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-500">관리자</span>
        </div>
        <Link href={`/markets/${marketId}/home`} className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 active:scale-95 transition-all">
          <User className="h-3.5 w-3.5" />일반화면
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white border border-gray-100 px-3 py-3.5 text-center">
          <p className="text-lg font-bold tabular-nums text-gray-900">{participants.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">참여자</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 px-3 py-3.5 text-center">
          <p className="text-lg font-bold tabular-nums text-gray-900">{activeMissions}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">활성 미션</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 px-3 py-3.5 text-center">
          <p className="text-lg font-bold tabular-nums text-emerald-500">+{totalGranted}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">총 지급</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { href: `scan`, icon: ScanLine, label: '미션 인증', bg: 'bg-emerald-50', color: 'text-emerald-500' },
          { href: `points`, icon: Coins, label: '달란트 지급', bg: 'bg-purple-50', color: 'text-purple-500' },
          { href: `pos`, icon: ShoppingBag, label: '물품 결제', bg: 'bg-rose-50', color: 'text-rose-500' },
        ].map(({ href, icon: Icon, label, bg, color }) => (
          <Link key={href} href={`/markets/${marketId}/admin/${href}`}
            className="flex flex-col items-center gap-2.5 rounded-2xl border border-gray-100 bg-white py-5 transition-colors hover:bg-gray-50 active:scale-95">
            <div className={`flex h-11 w-11 items-center justify-center rounded-full ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <span className="text-xs font-semibold text-gray-700">{label}</span>
          </Link>
        ))}
      </div>

      {recentLogs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">최근 활동</h2>
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden divide-y divide-gray-50">
            {recentLogs.map((log) => {
              const participant = participants.find((p) => p.user.id === log.userId)
              const label = log.reasonType === 'mission' ? log.missionTitle : log.reasonType === 'purchase' ? log.itemName : log.memo ?? '수동 지급'
              return (
                <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${log.amount > 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    {log.amount > 0 ? (log.reasonType === 'manual' ? <Gift className="h-4 w-4 text-emerald-500" /> : <TrendingUp className="h-4 w-4 text-emerald-500" />) : <TrendingDown className="h-4 w-4 text-rose-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{participant?.user.realName ?? '알 수 없음'}</p>
                    {label && <p className="text-xs text-gray-400 truncate">{label}</p>}
                  </div>
                  <span className={`text-sm font-bold tabular-nums shrink-0 ${log.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {log.amount > 0 ? `+${log.amount}` : log.amount}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 px-1">
            <span>총 사용</span>
            <span className="tabular-nums text-rose-400">-{totalSpent}</span>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: `page.tsx` 교체**

```tsx
import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/get-query-client'
import { marketsQuery, participantsQuery, missionsQuery, pointLogsQuery } from '@/lib/query/queries'
import { AdminHomeClient } from './AdminHomeClient'

export default async function AdminHomePage(props: PageProps<'/markets/[id]/admin/home'>) {
  const { id: marketId } = await props.params
  const qc = getQueryClient()
  await Promise.all([
    qc.prefetchQuery(marketsQuery.get({ marketId })),
    qc.prefetchQuery(participantsQuery.list({ marketId })),
    qc.prefetchQuery(missionsQuery.list({ marketId })),
    qc.prefetchQuery(pointLogsQuery.list({ marketId })),
  ])
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<p className="py-8 text-center text-sm text-gray-400">불러오는 중…</p>}>
        <AdminHomeClient marketId={marketId} />
      </Suspense>
    </HydrationBoundary>
  )
}
```

- [ ] **Step 3: 빌드 + 커밋**

```bash
pnpm build 2>&1 | tail -8
git add src/app/markets/
git commit -m "feat: admin home — prefetch + useSuspenseQueries"
```

---

### Task 8: 어드민 미션 관리 페이지

**Files:**
- Modify: `src/app/markets/[id]/admin/missions/page.tsx`

**Interfaces:**
- Consumes: `missionsQuery.list`, `missionsQuery.create`, `missionsQuery.update`, `missionsQuery.delete`

- [ ] **Step 1: page.tsx 전체 교체**

`useEffect + fetch` → `useSuspenseQuery + useMutation`, `useState<Mission[]>` 제거:

```tsx
'use client'

import { use, useState, useCallback } from 'react'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { BottomSheet } from '@/components/BottomSheet'
import { useModalHistory } from '@/hooks/use-modal-history'
import { missionsQuery } from '@/lib/query/queries'
import type { Mission, MissionType } from '@/types'

const TYPE_LABEL: Record<MissionType, string> = {
  user_qr: '유저 간 인증', upload: '업로드형', admin_qr: '관리자 인증', manual: '상시',
}
const TYPE_DESC: Record<MissionType, string> = {
  user_qr: '상대방이 내 QR을 찍어줌', upload: '사진 업로드 후 관리자 QR',
  admin_qr: '관리자에게 직접 QR 인증', manual: '관리자가 수동 지급',
}
const EMPTY_FORM = {
  title: '', description: '', reward: '', limitCount: '',
  type: 'user_qr' as MissionType, isGroup: false, activeFrom: '', activeUntil: '',
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}
function formatPeriod(from: string | null, until: string | null) {
  if (!from && !until) return '기간 제한 없음'
  if (from && until) return `${formatDate(from)} ~ ${formatDate(until)}`
  if (from) return `${formatDate(from)}부터`
  return `${formatDate(until)}까지`
}

export default function AdminMissionsPage(props: PageProps<'/markets/[id]/admin/missions'>) {
  const { id: marketId } = use(props.params)
  const qc = useQueryClient()

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const closeForm = useCallback(() => { setFormOpen(false); setEditingId(null); setForm(EMPTY_FORM) }, [])
  useModalHistory(formOpen, closeForm)

  const { data } = useSuspenseQuery(missionsQuery.list({ marketId }))
  const missions = data.data

  const invalidateMissions = { invalidates: [missionsQuery.list.queryKey({ marketId })] }

  const createMission = useMutation(missionsQuery.create(invalidateMissions))
  const updateMission = useMutation(missionsQuery.update(invalidateMissions))
  const deleteMission = useMutation(missionsQuery.delete(invalidateMissions))

  function openAdd() { setEditingId(null); setForm(EMPTY_FORM); setFormOpen(true) }
  function openEdit(mission: Mission) {
    setEditingId(mission.id)
    setForm({
      title: mission.title, description: mission.description ?? '',
      reward: String(mission.reward),
      limitCount: mission.limitCount !== null ? String(mission.limitCount) : '',
      type: mission.type, isGroup: mission.isGroup,
      activeFrom: mission.activeFrom ?? '', activeUntil: mission.activeUntil ?? '',
    })
    setExpandedId(null); setFormOpen(true)
  }

  async function toggleActive(missionId: string, current: boolean) {
    await updateMission.mutateAsync({ marketId, missionId, isActive: !current })
  }

  async function handleDelete(missionId: string) {
    await deleteMission.mutateAsync({ marketId, missionId })
    if (expandedId === missionId) setExpandedId(null)
  }

  async function submitForm() {
    if (!form.title.trim()) return
    const limitCount = form.limitCount.trim() ? Number(form.limitCount) : null
    const body = {
      title: form.title,
      description: form.description.trim() || undefined,
      reward: Number(form.reward) || 0,
      limitCount,
      type: form.type,
      isGroup: form.isGroup,
      activeFrom: form.activeFrom || null,
      activeUntil: form.activeUntil || null,
    }
    if (editingId) {
      await updateMission.mutateAsync({ marketId, missionId: editingId, ...body })
    } else {
      await createMission.mutateAsync({ marketId, ...body })
    }
    window.history.back()
  }

  return (
    <>
      <div className="px-4 pt-14 max-w-lg mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">미션 관리</h1>
          <Button onClick={openAdd} className="h-10 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 text-sm">
            <Plus className="mr-1 h-4 w-4" />미션 추가
          </Button>
        </div>
        <div className="space-y-3">
          {missions.map((mission) => (
            <div key={mission.id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-4">
                <button type="button" onClick={() => setExpandedId(expandedId === mission.id ? null : mission.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${mission.isActive ? 'text-gray-900' : 'text-gray-400'}`}>{mission.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-gray-400">{TYPE_LABEL[mission.type]}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">+{mission.reward}</span>
                      {mission.limitCount !== null && <><span className="text-xs text-gray-300">·</span><span className="text-xs text-gray-400">{mission.limitCount}회</span></>}
                      {mission.isGroup && <><span className="text-xs text-gray-300">·</span><span className="text-xs font-medium text-blue-500">단체</span></>}
                    </div>
                  </div>
                  {expandedId === mission.id ? <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />}
                </button>
                <Switch checked={mission.isActive} onCheckedChange={() => toggleActive(mission.id, mission.isActive)} className="data-[state=checked]:bg-emerald-500 shrink-0" />
              </div>
              {expandedId === mission.id && (
                <div className="border-t border-gray-50 bg-gray-50 px-4 py-3 space-y-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div><p className="text-gray-400">인증 방식</p><p className="font-medium text-gray-700">{TYPE_LABEL[mission.type]}</p></div>
                    <div><p className="text-gray-400">달란트</p><p className="font-medium text-gray-700">+{mission.reward}</p></div>
                    <div><p className="text-gray-400">최대 횟수</p><p className="font-medium text-gray-700">{mission.limitCount !== null ? `${mission.limitCount}회` : '무제한'}</p></div>
                    <div><p className="text-gray-400">단체 미션</p><p className="font-medium text-gray-700">{mission.isGroup ? '예' : '아니오'}</p></div>
                    <div className="col-span-2"><p className="text-gray-400">활성화 기간</p><p className="font-medium text-gray-700">{formatPeriod(mission.activeFrom, mission.activeUntil)}</p></div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => openEdit(mission)} className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                      <Pencil className="h-3 w-3" /> 수정
                    </button>
                    <button type="button" onClick={() => handleDelete(mission.id)} className="flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-100">
                      <Trash2 className="h-3 w-3" /> 삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {missions.length === 0 && <p className="py-8 text-center text-sm text-gray-400">등록된 미션이 없어요</p>}
        </div>
      </div>
      <BottomSheet open={formOpen} onClose={() => window.history.back()}>
        <div className="px-6 pb-10 pt-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">{editingId ? '미션 수정' : '새 미션'}</h2>
            <button type="button" onClick={() => window.history.back()} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500">미션 이름</p>
              <Input placeholder="미션 이름을 입력하세요" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="rounded-xl" autoFocus />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500">설명 <span className="text-gray-300">(선택)</span></p>
              <textarea placeholder="미션에 대한 설명을 입력하세요" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full resize-none rounded-xl border border-input bg-background px-3 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500">인증 방식</p>
              <div className="grid grid-cols-2 gap-2">
                {(['user_qr', 'upload', 'admin_qr', 'manual'] as MissionType[]).map((t) => (
                  <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${form.type === t ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                    <p className="text-xs font-semibold">{TYPE_LABEL[t]}</p>
                    <p className={`mt-0.5 text-[10px] ${form.type === t ? 'text-white/70' : 'text-gray-400'}`}>{TYPE_DESC[t]}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500">달란트 수량</p>
                <Input placeholder="0" type="number" value={form.reward} onChange={(e) => setForm((f) => ({ ...f, reward: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500">최대 횟수 (비우면 무제한)</p>
                <Input placeholder="무제한" type="number" value={form.limitCount} onChange={(e) => setForm((f) => ({ ...f, limitCount: e.target.value }))} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500">시작일 (선택)</p>
                <Input type="date" value={form.activeFrom} onChange={(e) => setForm((f) => ({ ...f, activeFrom: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500">종료일 (선택)</p>
                <Input type="date" value={form.activeUntil} onChange={(e) => setForm((f) => ({ ...f, activeUntil: e.target.value }))} className="rounded-xl" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5">
              <div>
                <p className="text-sm font-medium text-gray-800">단체 미션</p>
                <p className="text-xs text-gray-400">QR 스캔 시 함께 줄 인원 선택 가능</p>
              </div>
              <Switch checked={form.isGroup} onCheckedChange={(v) => setForm((f) => ({ ...f, isGroup: v }))} className="data-[state=checked]:bg-emerald-500" />
            </div>
            <Button onClick={submitForm} disabled={!form.title.trim()}
              className="h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40">
              {editingId ? '저장하기' : '미션 추가'}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
```

- [ ] **Step 2: 빌드 + 커밋**

```bash
pnpm build 2>&1 | tail -8
git add src/app/markets/
git commit -m "feat: admin missions — useSuspenseQuery + create/update/delete mutations"
```

---

### Task 9: 어드민 달란트 지급 페이지

**Files:**
- Modify: `src/app/markets/[id]/admin/points/page.tsx`

**Interfaces:**
- Consumes: `participantsQuery.list`, `participantsQuery.adjustPoints`

- [ ] **Step 1: page.tsx 교체**

`useEffect + fetch` → `useSuspenseQuery + useMutation`:

```tsx
'use client'

import { useState, use } from 'react'
import { useSuspenseQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { ChevronLeft, CheckSquare, Square, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { participantsQuery } from '@/lib/query/queries'

export default function AdminPointsPage(props: PageProps<'/markets/[id]/admin/points'>) {
  const { id: marketId } = use(props.params)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [done, setDone] = useState(false)

  const { data } = useSuspenseQuery(participantsQuery.list({ marketId }))
  const participants = data.data

  const adjustMutation = useMutation(
    participantsQuery.adjustPoints({
      invalidates: [participantsQuery.list.queryKey({ marketId })],
    })
  )

  const allSelected = participants.length > 0 && selected.size === participants.length
  const n = Number(amount)

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(participants.map((p) => p.user.id)))
  }
  function toggle(uid: string) {
    setSelected((prev) => { const next = new Set(prev); next.has(uid) ? next.delete(uid) : next.add(uid); return next })
  }

  async function apply(sign: 1 | -1) {
    if (!n || selected.size === 0 || adjustMutation.isPending) return
    await Promise.all(
      Array.from(selected).map((userId) =>
        adjustMutation.mutateAsync({ marketId, userId, amount: n * sign, memo: memo || undefined })
      )
    )
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-4 pt-14 pb-4 max-w-lg mx-auto">
        <Link href={`/markets/${marketId}/admin/home`} className="text-gray-400">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">달란트 일괄 지급</h1>
      </div>
      <div className="px-4 max-w-lg mx-auto space-y-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">지급 설정</p>
          <Input type="number" placeholder="달란트 수량" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="h-12 rounded-xl text-center tabular-nums text-lg font-bold" />
          <Input placeholder="메모 (예: 팀전 우승)" value={memo} onChange={(e) => setMemo(e.target.value)} className="rounded-xl" />
          <div className="flex gap-2">
            <Button onClick={() => apply(1)} disabled={!n || selected.size === 0 || adjustMutation.isPending}
              className="flex-1 h-11 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 gap-1.5 font-semibold disabled:opacity-40">
              {selected.size > 0 && n ? `${selected.size}명에게 +${n} 지급` : '지급'}
            </Button>
            <Button onClick={() => apply(-1)} disabled={!n || selected.size === 0 || adjustMutation.isPending}
              variant="outline" className="flex-1 h-11 rounded-xl border-rose-200 text-rose-500 hover:bg-rose-50 gap-1.5 font-semibold disabled:opacity-40">
              {selected.size > 0 && n ? `${selected.size}명에게 -${n} 차감` : '차감'}
            </Button>
          </div>
          {done && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-600">
              <CheckCircle className="h-4 w-4 shrink-0" />{selected.size}명에게 적용됐어요
            </div>
          )}
        </div>
        <button type="button" onClick={toggleAll}
          className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left hover:bg-gray-50">
          {allSelected ? <CheckSquare className="h-5 w-5 text-emerald-500 shrink-0" /> : <Square className="h-5 w-5 text-gray-300 shrink-0" />}
          <span className="text-sm font-semibold text-gray-700">전체 선택 ({selected.size}/{participants.length})</span>
        </button>
        <div className="space-y-2">
          {participants.map((p) => {
            const isSelected = selected.has(p.user.id)
            return (
              <button key={p.user.id} type="button" onClick={() => toggle(p.user.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${isSelected ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
                {isSelected ? <CheckSquare className="h-5 w-5 text-emerald-500 shrink-0" /> : <Square className="h-5 w-5 text-gray-300 shrink-0" />}
                <div className="flex min-w-0 flex-1 items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">{p.user.realName[0]}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{p.user.realName}</p>
                      {p.role === 'admin' && <span className="text-[10px] text-purple-500">관리자</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums text-emerald-500">{p.balance}</p>
                    {n > 0 && isSelected && <p className="text-xs tabular-nums text-gray-400">→ {p.balance + n}</p>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 빌드 + 커밋**

```bash
pnpm build 2>&1 | tail -8
git add src/app/markets/
git commit -m "feat: admin points — useSuspenseQuery + adjustPoints mutation"
```

---

### Task 10: 어드민 스캔 페이지

**Files:**
- Modify: `src/app/markets/[id]/admin/scan/page.tsx`

**Interfaces:**
- Consumes: `missionsQuery.list` (status=active), `participantsQuery.list`, `missionsQuery.verify`
- Note: full-screen overlay — prefetch shell 없이 클라이언트 전용

- [ ] **Step 1: page.tsx 교체**

```tsx
'use client'

import { useState, use } from 'react'
import { useSuspenseQueries, useMutation } from '@tanstack/react-query'
import { CheckCircle2, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { QRScanner } from '@/components/QRScanner'
import { parseQR } from '@/lib/qr'
import { missionsQuery, participantsQuery } from '@/lib/query/queries'
import type { Mission, MarketParticipant } from '@/types'

type ScanState = 'idle' | 'picking_mission' | 'picking_user' | 'confirm' | 'group' | 'done'

export default function ScanPage(props: PageProps<'/markets/[id]/admin/scan'>) {
  const { id: marketId } = use(props.params)
  const router = useRouter()

  const [state, setState] = useState<ScanState>('idle')
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [selectedUser, setSelectedUser] = useState<MarketParticipant | null>(null)
  const [groupUsers, setGroupUsers] = useState<string[]>([])

  const [{ data: missionsData }, { data: participantsData }] = useSuspenseQueries({
    queries: [
      missionsQuery.list({ marketId, status: 'active' }),
      participantsQuery.list({ marketId }),
    ],
  })

  const missions = missionsData.data.filter((m) => m.type === 'admin_qr' || m.type === 'upload')
  const participants = participantsData.data

  const verifyMutation = useMutation(
    missionsQuery.verify({
      invalidates: [participantsQuery.list.queryKey({ marketId })],
    })
  )

  function handleScan(val: string) {
    const qr = parseQR(val)
    if (qr?.type === 'mission') {
      const mission = missions.find((m) => m.id === qr.missionId)
      const participant = participants.find((p) => p.user.id === qr.userId)
      if (mission && participant) { setSelectedMission(mission); setSelectedUser(participant); setState('confirm'); return }
    }
    setState('picking_mission')
  }

  function handleSimulate() {
    const mission = missions[0]; const participant = participants[0]
    if (mission && participant) { setSelectedMission(mission); setSelectedUser(participant); setState('confirm') }
    else setState('picking_mission')
  }

  async function confirmVerify(extraUserIds: string[] = []) {
    if (!selectedMission || !selectedUser) return
    const allUserIds = [selectedUser.user.id, ...extraUserIds]
    await Promise.all(
      allUserIds.map((userId) =>
        verifyMutation.mutateAsync({ marketId, missionId: selectedMission.id, userId, verifiedBy: 'admin' })
      )
    )
    setState('done')
  }

  function reset() { setState('idle'); setSelectedMission(null); setSelectedUser(null); setGroupUsers([]) }
  function toggleGroupUser(uid: string) {
    setGroupUsers((prev) => prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid])
  }

  const otherParticipants = participants.filter((p) => p.user.id !== selectedUser?.user.id)

  return (
    <QRScanner open title="QR 스캔" hint="미션 인증 QR을 화면 중앙에 맞춰주세요"
      onScan={handleScan} onSimulate={handleSimulate} onClose={() => router.back()}>
      {state === 'picking_mission' && (
        <div className="flex flex-1 flex-col justify-end">
          <div className="rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-4">
            <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
            <p className="text-sm font-semibold text-gray-700">어떤 미션인가요?</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {missions.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">활성 미션이 없어요</p>
              ) : missions.map((m) => (
                <button key={m.id} type="button" onClick={() => { setSelectedMission(m); setState('picking_user') }}
                  className="flex h-14 w-full items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 text-left hover:bg-emerald-50 hover:border-emerald-200 transition-colors">
                  <span className="text-sm font-semibold text-gray-800">{m.title}</span>
                  <span className="text-sm font-bold text-emerald-500">+{m.reward}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {state === 'picking_user' && selectedMission && (
        <div className="flex flex-1 flex-col justify-end">
          <div className="rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-4">
            <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
            <div>
              <p className="text-sm font-semibold text-gray-700">누구의 QR인가요?</p>
              <p className="text-xs text-gray-400 mt-0.5">{selectedMission.title} · +{selectedMission.reward} 달란트</p>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {participants.map((p) => (
                <button key={p.user.id} type="button" onClick={() => { setSelectedUser(p); setState('confirm') }}
                  className="flex h-14 w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 text-left hover:bg-emerald-50 hover:border-emerald-200 transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">{p.user.realName[0]}</div>
                  <div><p className="text-sm font-semibold text-gray-800">{p.user.realName}</p><p className="text-xs text-gray-400">{p.balance} 달란트 보유</p></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {state === 'confirm' && selectedMission && selectedUser && (
        <div className="flex flex-1 flex-col justify-end">
          <div className="rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-5">
            <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-400">미션 인증 요청</p>
              <h3 className="text-lg font-bold text-gray-900">{selectedMission.title}</h3>
              <p className="text-sm text-gray-500">{selectedUser.user.realName} · +{selectedMission.reward} 달란트</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset} className="h-12 flex-1 rounded-full text-sm font-semibold">취소</Button>
              <Button onClick={() => selectedMission.isGroup ? setState('group') : confirmVerify()}
                className="h-12 flex-1 rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600">확인</Button>
            </div>
          </div>
        </div>
      )}
      {state === 'group' && selectedMission && selectedUser && (
        <div className="flex flex-1 flex-col justify-end">
          <div className="rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-4">
            <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-500" />
              <h3 className="font-bold text-gray-900">단체 미션 — 함께한 참여자</h3>
            </div>
            <div className="max-h-44 overflow-y-auto space-y-2">
              {otherParticipants.map((p) => (
                <button key={p.id} type="button" onClick={() => toggleGroupUser(p.user.id)}
                  className={`flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm font-medium transition-colors ${groupUsers.includes(p.user.id) ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-700'}`}>
                  <span>{p.user.realName}</span>
                  {groupUsers.includes(p.user.id) && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                </button>
              ))}
            </div>
            <Button onClick={() => confirmVerify(groupUsers)} className="h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600">
              {groupUsers.length > 0 ? `${groupUsers.length + 1}명 달란트 적립` : '본인만 적립'}
            </Button>
          </div>
        </div>
      )}
      {state === 'done' && selectedMission && selectedUser && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <CheckCircle2 className="h-20 w-20 text-emerald-400" />
          <div>
            <p className="text-xl font-bold text-white">달란트 적립 완료!</p>
            <p className="mt-1 text-sm text-white/60">{selectedMission.title} · +{selectedMission.reward} 달란트</p>
          </div>
          <Button onClick={reset} className="mt-4 h-12 w-full max-w-xs rounded-full bg-white text-sm font-semibold text-gray-900 hover:bg-white/90">다음 스캔</Button>
        </div>
      )}
    </QRScanner>
  )
}
```

- [ ] **Step 2: 빌드 + 커밋**

```bash
pnpm build 2>&1 | tail -8
git add src/app/markets/
git commit -m "feat: admin scan — useSuspenseQueries + verify mutation"
```

---

### Task 11: 어드민 POS 페이지

**Files:**
- Modify: `src/app/markets/[id]/admin/pos/page.tsx`

**Interfaces:**
- Consumes: `itemsQuery.list`, `participantsQuery.list`, `ordersQuery.create`

- [ ] **Step 1: page.tsx 교체**

```tsx
'use client'

import { useState, use } from 'react'
import { useSuspenseQueries, useMutation } from '@tanstack/react-query'
import { Plus, Minus, ShoppingCart, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QRScanner } from '@/components/QRScanner'
import { parseQR } from '@/lib/qr'
import { itemsQuery, participantsQuery, ordersQuery } from '@/lib/query/queries'
import type { MarketItem, MarketParticipant } from '@/types'

type CartEntry = { item: MarketItem; qty: number }
type ScanState = 'idle' | 'scanning' | 'picking_user' | 'confirm' | 'done'

export default function PosPage(props: PageProps<'/markets/[id]/admin/pos'>) {
  const { id: marketId } = use(props.params)
  const [cart, setCart] = useState<CartEntry[]>([])
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [scannedUser, setScannedUser] = useState<MarketParticipant | null>(null)

  const [{ data: itemsData }, { data: participantsData }] = useSuspenseQueries({
    queries: [
      itemsQuery.list({ marketId }),
      participantsQuery.list({ marketId }),
    ],
  })

  const items = itemsData.data
  const participants = participantsData.data
  const total = cart.reduce((s, e) => s + e.item.price * e.qty, 0)

  const createOrder = useMutation(
    ordersQuery.create({
      invalidates: [participantsQuery.list.queryKey({ marketId })],
    })
  )

  function addToCart(item: MarketItem) {
    setCart((prev) => {
      const e = prev.find((e) => e.item.id === item.id)
      return e ? prev.map((e) => e.item.id === item.id ? { ...e, qty: e.qty + 1 } : e) : [...prev, { item, qty: 1 }]
    })
  }
  function changeQty(itemId: string, delta: number) {
    setCart((prev) => prev.map((e) => e.item.id === itemId ? { ...e, qty: e.qty + delta } : e).filter((e) => e.qty > 0))
  }

  function handleScan(val: string) {
    const qr = parseQR(val)
    if (qr?.type === 'pay') {
      const participant = participants.find((p) => p.user.id === qr.userId)
      if (participant) { setScannedUser(participant); setScanState('confirm'); return }
    }
    setScanState('picking_user')
  }
  function handleSimulate() {
    const p = participants[0]
    if (p) { setScannedUser(p); setScanState('confirm') } else setScanState('picking_user')
  }

  async function confirmPayment() {
    if (!scannedUser) return
    await createOrder.mutateAsync({
      marketId,
      userId: scannedUser.user.id,
      verifiedBy: 'admin',
      items: cart.map(({ item, qty }) => ({ name: item.name, price: item.price, qty })),
    })
    setScanState('done')
  }

  function reset() { setScanState('idle'); setScannedUser(null); setCart([]) }

  const updatedUser = scannedUser ? (participants.find((p) => p.user.id === scannedUser.user.id) ?? scannedUser) : null

  return (
    <>
      <div className="px-4 pt-14 max-w-lg mx-auto space-y-5">
        <h1 className="text-xl font-bold text-gray-900">물품 결제</h1>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((item) => {
            const inCart = cart.find((e) => e.item.id === item.id)
            return (
              <button key={item.id} type="button" onClick={() => addToCart(item)}
                className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition-colors active:scale-95 ${inCart ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
                {inCart && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">{inCart.qty}</span>}
                <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                <p className="text-base font-bold tabular-nums text-emerald-500">{item.price}</p>
              </button>
            )
          })}
          {items.length === 0 && <p className="col-span-2 py-6 text-center text-sm text-gray-400">등록된 물품이 없어요</p>}
        </div>
        {cart.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
              <ShoppingCart className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-700">장바구니</p>
            </div>
            <div className="divide-y divide-gray-50">
              {cart.map(({ item, qty }) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm text-gray-700">{item.name}</p>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => changeQty(item.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"><Minus className="h-3 w-3 text-gray-600" /></button>
                    <span className="w-6 text-center text-sm font-bold tabular-nums">{qty}</span>
                    <button type="button" onClick={() => changeQty(item.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"><Plus className="h-3 w-3 text-gray-600" /></button>
                    <span className="w-12 text-right text-sm tabular-nums text-rose-500">-{item.price * qty}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
              <span className="text-sm font-semibold text-gray-700">합계</span>
              <span className="text-base font-bold tabular-nums text-rose-500">-{total}</span>
            </div>
          </div>
        )}
        {cart.length > 0 ? (
          <Button onClick={() => setScanState('scanning')} className="h-12 w-full rounded-2xl bg-rose-500 text-sm font-semibold text-white hover:bg-rose-600">
            결제하기 ({total} 달란트)
          </Button>
        ) : (
          <p className="py-4 text-center text-sm text-gray-400">물품을 선택하면 장바구니에 담겨요</p>
        )}
      </div>
      <QRScanner open={scanState !== 'idle'} title="결제 QR 스캔" hint="유저의 결제 QR을 화면 중앙에 맞춰주세요"
        badge={<span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold tabular-nums text-white">-{total} 달란트</span>}
        onScan={handleScan} onSimulate={handleSimulate} onClose={() => setScanState('idle')}>
        {scanState === 'picking_user' && (
          <div className="flex flex-1 flex-col justify-end">
            <div className="max-h-[70svh] overflow-y-auto rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-4">
              <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
              <p className="text-sm font-semibold text-gray-700">누구의 QR인가요?</p>
              <div className="space-y-2">
                {participants.map((p) => (
                  <button key={p.user.id} type="button" onClick={() => { setScannedUser(p); setScanState('confirm') }}
                    className="flex h-14 w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 text-left hover:bg-rose-50 hover:border-rose-200 transition-colors">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">{p.user.realName[0]}</div>
                    <div><p className="text-sm font-semibold text-gray-800">{p.user.realName}</p><p className="text-xs text-gray-400">{p.balance} 달란트 보유</p></div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {scanState === 'confirm' && updatedUser && (
          <div className="flex flex-1 flex-col justify-end">
            <div className="rounded-t-3xl bg-white px-6 pb-10 pt-5 space-y-5">
              <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-base font-bold text-gray-600">{updatedUser.user.realName[0]}</div>
                <div>
                  <p className="font-bold text-gray-900">{updatedUser.user.realName}</p>
                  <p className="text-sm text-gray-500">잔액 {updatedUser.balance} → {updatedUser.balance - total}</p>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-1">
                {cart.map(({ item, qty }) => (
                  <div key={item.id} className="flex justify-between text-sm text-gray-600">
                    <span>{item.name} × {qty}</span><span className="tabular-nums">{item.price * qty}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-gray-100 pt-2 text-sm font-bold">
                  <span>합계</span><span className="tabular-nums text-rose-500">-{total}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setScanState('picking_user')} className="h-12 flex-1 rounded-full text-sm font-semibold">다시 선택</Button>
                <Button onClick={confirmPayment} className="h-12 flex-1 rounded-full bg-rose-500 text-sm font-semibold text-white hover:bg-rose-600">결제 확인</Button>
              </div>
            </div>
          </div>
        )}
        {scanState === 'done' && updatedUser && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <CheckCircle2 className="h-20 w-20 text-rose-300" />
            <div>
              <p className="text-xl font-bold text-white">결제 완료!</p>
              <p className="mt-1 text-sm text-white/60">{updatedUser.user.realName} · -{total} 달란트</p>
            </div>
            <Button onClick={reset} className="mt-4 h-12 w-full max-w-xs rounded-full bg-white text-sm font-semibold text-gray-900 hover:bg-white/90">다음 결제</Button>
          </div>
        )}
      </QRScanner>
    </>
  )
}
```

- [ ] **Step 2: 빌드 + 커밋**

```bash
pnpm build 2>&1 | tail -8
git add src/app/markets/
git commit -m "feat: admin pos — useSuspenseQueries + createOrder mutation"
```

---

### Task 12: 어드민 물품 관리 페이지

**Files:**
- Modify: `src/app/markets/[id]/admin/items/page.tsx`

**Interfaces:**
- Consumes: `itemsQuery.list`, `itemsQuery.create`, `itemsQuery.delete`

- [ ] **Step 1: page.tsx 교체**

```tsx
'use client'

import { useState, use } from 'react'
import { useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { itemsQuery } from '@/lib/query/queries'

export default function AdminItemsPage(props: PageProps<'/markets/[id]/admin/items'>) {
  const { id: marketId } = use(props.params)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')

  const { data } = useSuspenseQuery(itemsQuery.list({ marketId }))
  const items = data.data

  const invalidateItems = { invalidates: [itemsQuery.list.queryKey({ marketId })] }
  const createItem = useMutation(itemsQuery.create(invalidateItems))
  const deleteItem = useMutation(itemsQuery.delete(invalidateItems))

  async function addItem() {
    if (!newName.trim() || !newPrice) return
    await createItem.mutateAsync({ marketId, name: newName.trim(), price: Number(newPrice) })
    setNewName('')
    setNewPrice('')
  }

  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/markets/${marketId}/admin/home`} className="text-gray-400">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">물품 관리</h1>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500">새 물품 추가</p>
        <div className="flex gap-2">
          <Input placeholder="물품명" value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()} className="h-12 flex-1 rounded-xl" />
          <Input placeholder="달란트" type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()} className="h-12 w-24 rounded-xl" />
        </div>
        <Button onClick={addItem} disabled={!newName.trim() || !newPrice || createItem.isPending}
          className="h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40">
          <Plus className="mr-1.5 h-4 w-4" />추가하기
        </Button>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">등록된 물품이 없어요</p>
        ) : items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3.5">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-gray-800">{item.name}</p>
              <p className="text-xs tabular-nums text-emerald-500">{item.price} 달란트</p>
            </div>
            <button type="button" onClick={() => deleteItem.mutate({ marketId, itemId: item.id })}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-rose-50 hover:text-rose-400">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 빌드 + 커밋**

```bash
pnpm build 2>&1 | tail -8
git add src/app/markets/
git commit -m "feat: admin items — useSuspenseQuery + create/delete mutations"
```

---

### Task 13: 어드민 유저 목록 + 상세 페이지

**Files:**
- Modify: `src/app/markets/[id]/admin/users/page.tsx`
- Create: `src/app/markets/[id]/admin/users/AdminUsersClient.tsx`
- Modify: `src/app/markets/[id]/admin/users/[userId]/page.tsx`
- Create: `src/app/markets/[id]/admin/users/[userId]/AdminUserDetailClient.tsx`

**Interfaces:**
- Consumes: `participantsQuery.list`, `participantsQuery.get`, `missionsQuery.list`

- [ ] **Step 1: `AdminUsersClient.tsx` 생성**

```tsx
'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { participantsQuery } from '@/lib/query/queries'

export function AdminUsersClient({ marketId }: { marketId: string }) {
  const { data } = useSuspenseQuery(participantsQuery.list({ marketId }))
  const sorted = [...data.data].sort((a, b) => b.balance - a.balance)

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input type="search" placeholder="이름으로 검색" className="rounded-xl pl-9" />
      </div>
      <div className="space-y-2">
        {sorted.map((p) => (
          <Link key={p.id} href={`/markets/${marketId}/admin/users/${p.user.id}`}
            className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">{p.user.realName.slice(0, 1)}</div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{p.user.realName}</p>
                  {p.role === 'admin' && <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-600">관리자</span>}
                </div>
              </div>
            </div>
            <span className="text-base font-bold tabular-nums text-emerald-500">{p.balance}</span>
          </Link>
        ))}
      </div>
    </>
  )
}
```

- [ ] **Step 2: `admin/users/page.tsx` 교체**

```tsx
import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/get-query-client'
import { participantsQuery } from '@/lib/query/queries'
import { AdminUsersClient } from './AdminUsersClient'

export default async function AdminUsersPage(props: PageProps<'/markets/[id]/admin/users'>) {
  const { id: marketId } = await props.params
  const qc = getQueryClient()
  await qc.prefetchQuery(participantsQuery.list({ marketId }))
  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">유저 관리</h1>
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense fallback={<p className="py-8 text-center text-sm text-gray-400">불러오는 중…</p>}>
          <AdminUsersClient marketId={marketId} />
        </Suspense>
      </HydrationBoundary>
    </div>
  )
}
```

- [ ] **Step 3: `AdminUserDetailClient.tsx` 생성**

```tsx
'use client'

import { useSuspenseQueries } from '@tanstack/react-query'
import { participantsQuery, missionsQuery } from '@/lib/query/queries'

export function AdminUserDetailClient({ marketId, userId }: { marketId: string; userId: string }) {
  const [{ data: participantData }, { data: missionsData }] = useSuspenseQueries({
    queries: [
      participantsQuery.get({ marketId, userId }),
      missionsQuery.list({ marketId }),
    ],
  })

  const participant = participantData.data
  const missions = missionsData.data
  const completedMissions = missions.filter((m) => m.slots?.some((s) => s.verifiedAt !== null))

  return (
    <div className="px-4 max-w-lg mx-auto space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-emerald-50 p-4 space-y-1">
          <p className="text-xs font-medium text-emerald-600">달란트 잔액</p>
          <p className="text-2xl font-bold tabular-nums text-emerald-700">{participant.balance}</p>
        </div>
        <div className="rounded-2xl bg-gray-50 p-4 space-y-1">
          <p className="text-xs font-medium text-gray-500">미션 완료</p>
          <p className="text-2xl font-bold tabular-nums text-gray-700">{completedMissions.length}</p>
        </div>
      </div>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">미션 현황</h2>
        <div className="space-y-2">
          {missions.map((m) => {
            const done = m.slots?.filter((s) => s.verifiedAt !== null).length ?? 0
            return (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
                <span className="text-sm text-gray-700">{m.title}</span>
                <span className="text-xs font-medium text-gray-400">{done}/{m.limitCount ?? '∞'}회</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: `admin/users/[userId]/page.tsx` 교체**

```tsx
import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getQueryClient } from '@/lib/query/get-query-client'
import { participantsQuery, missionsQuery } from '@/lib/query/queries'
import { AdminUserDetailClient } from './AdminUserDetailClient'

export default async function AdminUserDetailPage(props: PageProps<'/markets/[id]/admin/users/[userId]'>) {
  const { id: marketId, userId } = await props.params
  const qc = getQueryClient()
  await Promise.all([
    qc.prefetchQuery(participantsQuery.get({ marketId, userId })),
    qc.prefetchQuery(missionsQuery.list({ marketId })),
  ])
  return (
    <div>
      <div className="flex items-center gap-3 px-4 pt-14 pb-4 max-w-lg mx-auto">
        <Link href={`/markets/${marketId}/admin/users`} className="text-gray-400">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">유저 상세</h1>
      </div>
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense fallback={<p className="py-8 text-center text-sm text-gray-400">불러오는 중…</p>}>
          <AdminUserDetailClient marketId={marketId} userId={userId} />
        </Suspense>
      </HydrationBoundary>
    </div>
  )
}
```

- [ ] **Step 5: 빌드 + 커밋**

```bash
pnpm build 2>&1 | tail -8
git add src/app/markets/
git commit -m "feat: admin users — prefetch + useSuspenseQuery"
```

---

### Task 14: store.ts 제거 + 최종 정리

**Files:**
- Delete: `src/lib/store.ts`
- Verify: `src/lib/mock-data.ts` (store 삭제 후 참조 없으면 함께 삭제 가능)

- [ ] **Step 1: store.ts 참조 확인**

```bash
grep -r "from '@/lib/store'" src/ --include="*.ts" --include="*.tsx"
grep -r "from '@/lib/store'" src/app/api/ --include="*.ts"
```

API 라우트들이 여전히 `store`를 import해 사용하므로 **API 라우트의 store 참조는 유지**. 페이지 컴포넌트에서 store 참조가 0이 되면 store.ts 자체는 유지.

- [ ] **Step 2: 페이지에 남은 store import 확인 및 제거**

```bash
grep -r "from '@/lib/store'" src/app/markets/ --include="*.tsx"
```

출력이 없으면 모든 페이지에서 store 제거 완료.

- [ ] **Step 3: 최종 빌드 + lint**

```bash
pnpm build 2>&1 | tail -8
pnpm lint
```

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "feat: complete TanStack Query + @routar/react-query migration"
```

---

## Self-Review

**Spec coverage:**
- ✅ 인프라 (get-query-client, queries.ts, Providers) — Task 1
- ✅ router.ts 누락 엔드포인트 추가 — Task 2
- ✅ items DELETE API — Task 2
- ✅ 12개 페이지 전체 전환 — Tasks 3-13
- ✅ store.ts 정리 — Task 14
- ✅ flatten: true 모든 createQueries에 적용
- ✅ SSR prefetch 서버 컴포넌트 페이지에 적용
- ✅ useSuspenseQuery로 로딩 분기 제거
- ✅ useMutation + invalidates로 캐시 자동 무효화

**타입 일관성:**
- `data.data` 접근 패턴 — routar 응답 래퍼가 `{ data: ... }` 형태이므로 일관 적용됨
- `missionsQuery.update` vars: `{ marketId, missionId, ...patch }` — flatten: true이므로 flat하게 전달
- `participantsQuery.get` — `{ marketId, userId }` flat params
