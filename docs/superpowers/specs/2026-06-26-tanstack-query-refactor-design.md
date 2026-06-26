# TanStack Query + @routar/react-query 리팩토링 설계

**날짜:** 2026-06-26  
**범위:** 전체 API 호출 → `@tanstack/react-query` + `@routar/react-query` 기반으로 전환  
**결정 사항:** flatten: true, 전체 페이지 (서버 + 클라이언트), SSR prefetch 적용

---

## 목표

- `store` 직접 접근 제거 (서버 컴포넌트)
- `useEffect + fetch` 패턴 제거 (클라이언트 컴포넌트)
- 모든 데이터 fetching을 `useSuspenseQuery` / `useMutation` 기반으로 통일
- 서버 컴포넌트에서 `prefetchQuery + HydrationBoundary`로 SSR hydration 보장
- mutation 후 `invalidates` 선언으로 자동 캐시 무효화

---

## 레이어 구조

```
Server Page (RSC)
  └─ getQueryClient() → prefetchQuery(xyzQuery.endpoint({ ...flatParams }))
       └─ <HydrationBoundary state={dehydrate(queryClient)}>
            └─ <Suspense fallback={<LoadingUI />}>
                 └─ <XyzClient />  ('use client')
                      └─ useSuspenseQuery(xyzQuery.endpoint({ ...flatParams }))
                           // data는 항상 non-nullable — 로딩 분기 불필요
```

---

## 인프라 파일

### 1. `src/lib/query/get-query-client.ts` (신규)

서버는 요청마다 새 인스턴스, 브라우저는 싱글턴.  
`routarQueryClient()`를 사용해 `mutationCache`(invalidates 자동처리) 내장.

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

### 2. `src/lib/query/queries.ts` (신규)

모든 API 도메인의 query/mutation 액세서를 단일 파일에서 export.  
`flatten: true`로 `{ marketId, userId }` 형태 flat 호출 사용.

```ts
import { createQueries } from '@routar/react-query'
import {
  marketsApi, participantsApi, missionsApi,
  pointLogsApi, ordersApi, itemsApi, adminApi,
} from '@/lib/api/client'

export const marketsQuery    = createQueries(marketsApi,      { flatten: true })
export const participantsQuery = createQueries(participantsApi, { flatten: true })
export const missionsQuery   = createQueries(missionsApi,     { flatten: true })
export const pointLogsQuery  = createQueries(pointLogsApi,   { flatten: true })
export const ordersQuery     = createQueries(ordersApi,       { flatten: true })
export const itemsQuery      = createQueries(itemsApi,        { flatten: true })
export const adminQuery      = createQueries(adminApi,        { flatten: true })
```

### 3. `src/components/providers.tsx` (신규)

`QueryClientProvider` 래퍼. `useState` 필수 (`getQueryClient()` 사용 금지).

```tsx
'use client'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routarQueryClient } from '@routar/react-query'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() =>
    routarQueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } })
  )
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

### 4. `src/app/layout.tsx` (수정)

루트 레이아웃에 `<Providers>` 추가.

---

## 페이지별 변환 계획

### 서버 컴포넌트 페이지 (store → prefetch + Client 분리)

| 페이지 | prefetch 대상 | 생성할 Client 컴포넌트 |
|--------|--------------|----------------------|
| `(user)/home` | marketsQuery.get, participantsQuery.get, pointLogsQuery.list | `UserHomeClient` |
| `(user)/missions` | missionsQuery.list | `MissionListClient` |
| `(user)/history` | participantsQuery.get, pointLogsQuery.list, ordersQuery.list | `HistoryClient` |
| `admin/home` | marketsQuery.get, participantsQuery.list, missionsQuery.list, pointLogsQuery.list | `AdminHomeClient` |
| `admin/users` | participantsQuery.list | `AdminUsersClient` |
| `admin/users/[userId]` | participantsQuery.get, missionsQuery.list | `AdminUserDetailClient` |

**패턴:**
```tsx
// page.tsx (server component)
export default async function XyzPage(props: PageProps<'/markets/[id]/xyz'>) {
  const { id: marketId } = await props.params
  const qc = getQueryClient()
  await qc.prefetchQuery(xyzQuery.list({ marketId }))
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<p className="text-center text-sm text-gray-400 py-8">불러오는 중…</p>}>
        <XyzClient marketId={marketId} />
      </Suspense>
    </HydrationBoundary>
  )
}

// XyzClient.tsx ('use client')
export function XyzClient({ marketId }: { marketId: string }) {
  const { data } = useSuspenseQuery(xyzQuery.list({ marketId }))
  // data는 항상 non-nullable
}
```

---

### 클라이언트 컴포넌트 페이지 (useEffect+fetch → useSuspenseQuery + useMutation)

| 페이지 | 조회 | 뮤테이션 |
|--------|------|---------|
| `(user)/missions/[missionId]` | missionsQuery.get, participantsQuery.list | missionsQuery.verify |
| `admin/missions` | missionsQuery.list | missionsQuery.create, .update, .delete (PATCH/DELETE) |
| `admin/points` | participantsQuery.list | participantsQuery.adjustPoints |
| `admin/scan` | missionsQuery.list (status=active), participantsQuery.list | missionsQuery.verify |
| `admin/pos` | itemsQuery.list, participantsQuery.list | ordersQuery.create |
| `admin/items` | itemsQuery.list | itemsQuery.create (POST); delete는 현재 local-only — router에 DELETE endpoint 추가 후 itemsQuery.delete mutation 연결 |

**패턴 — 조회:**
```tsx
// useEffect + fetch 제거, 대신:
const { data: missions } = useSuspenseQuery(missionsQuery.list({ marketId: id }))
// if (!missions) return ... 분기 제거 가능
```

**패턴 — 뮤테이션 (invalidates 선언):**
```tsx
const verifyMutation = useMutation(
  missionsQuery.verify({
    invalidates: [missionsQuery.get.queryKey({ marketId, missionId })],
  })
)
// 호출: verifyMutation.mutate({ marketId, missionId, userId, verifiedBy })
```

**클라이언트 페이지에 서버 prefetch 래핑 추가:**  
현재 클라이언트 컴포넌트 페이지들도 서버 컴포넌트 shell로 감싸 prefetch를 추가한다.  
단, `admin/scan`은 full-screen overlay 특성상 prefetch shell 없이 클라이언트만 유지.

---

## Mutation Invalidation 전략

`routarQueryClient()`로 생성한 QueryClient는 `mutationCache`가 자동 내장되어  
`invalidates` 배열의 키들을 mutation 성공 시 자동으로 무효화한다.

```
missionsQuery.verify({ invalidates: [missionsQuery.get.queryKey({ marketId, missionId })] })
  → verify 성공 → get 쿼리 자동 refetch
```

도메인 전체 무효화 필요 시: `missionsQuery.$key` 사용.

---

## 에러 처리

- `Suspense` + `useSuspenseQuery`: 에러는 Next.js App Router `error.tsx`로 버블링
- mutation 에러: 각 컴포넌트에서 `mutation.isError` / `mutation.error`로 인라인 처리
- 별도 `ErrorBoundary` 컴포넌트 추가는 이번 범위 외

---

## 제거 대상

- `src/lib/store.ts` — 모든 페이지에서 store import 제거 후 삭제
- 모든 페이지의 `if (!data) return <Loading />` 분기
- 모든 `useEffect(() => { fetch(...).then(...).then(setX) }, [...])`
- `useState<X[]>([])` + setter 패턴 (서버 데이터 캐싱은 TanStack Query가 담당)

---

## 설치

```bash
pnpm add @tanstack/react-query @routar/react-query
```

---

## 파일 변경 요약

| 파일 | 작업 |
|------|------|
| `src/lib/query/get-query-client.ts` | 신규 |
| `src/lib/query/queries.ts` | 신규 |
| `src/components/providers.tsx` | 신규 |
| `src/app/layout.tsx` | Providers 래핑 추가 |
| `src/app/markets/[id]/(user)/home/page.tsx` | prefetch + HydrationBoundary |
| `src/app/markets/[id]/(user)/home/UserHomeClient.tsx` | 신규 (클라이언트 컴포넌트) |
| `src/app/markets/[id]/(user)/missions/page.tsx` | prefetch + HydrationBoundary |
| `src/app/markets/[id]/(user)/missions/MissionListClient.tsx` | 신규 |
| `src/app/markets/[id]/(user)/missions/[missionId]/page.tsx` | prefetch shell + useSuspenseQuery |
| `src/app/markets/[id]/(user)/history/page.tsx` | prefetch + HydrationBoundary |
| `src/app/markets/[id]/(user)/history/HistoryClient.tsx` | 신규 |
| `src/app/markets/[id]/admin/home/page.tsx` | prefetch + HydrationBoundary |
| `src/app/markets/[id]/admin/home/AdminHomeClient.tsx` | 신규 |
| `src/app/markets/[id]/admin/missions/page.tsx` | prefetch shell + useSuspenseQuery + useMutation |
| `src/app/markets/[id]/admin/points/page.tsx` | prefetch shell + useSuspenseQuery + useMutation |
| `src/app/markets/[id]/admin/scan/page.tsx` | useSuspenseQuery + useMutation (prefetch 없음) |
| `src/app/markets/[id]/admin/pos/page.tsx` | prefetch shell + useSuspenseQuery + useMutation |
| `src/app/markets/[id]/admin/items/page.tsx` | prefetch shell + useSuspenseQuery + useMutation |
| `src/app/markets/[id]/admin/users/page.tsx` | prefetch + HydrationBoundary |
| `src/app/markets/[id]/admin/users/AdminUsersClient.tsx` | 신규 |
| `src/app/markets/[id]/admin/users/[userId]/page.tsx` | prefetch shell + useSuspenseQuery |
| `src/lib/store.ts` | 삭제 (모든 참조 제거 후) |
