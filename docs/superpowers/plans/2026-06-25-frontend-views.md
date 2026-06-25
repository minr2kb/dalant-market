# Frontend Views 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dalant Market의 전체 화면(16개)을 정적 mock 데이터로 구현한다.

**Architecture:** Next.js 16 App Router의 route groups `(user)` / `(admin)`으로 역할별 레이아웃을 분리하고, 모든 화면은 `/markets/[id]` 하위에 위치한다. shadcn/ui 컴포넌트 위에 커스텀 FloatingTabBar와 도메인 컴포넌트를 조합한다.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, lucide-react, Noto Sans KR

## Global Constraints

- Next.js 16: `params`는 `Promise<{...}>` — 반드시 `const { id } = await params` 형태로 사용
- Next.js 16: `PageProps<'/path'>` / `LayoutProps<'/path'>` 는 전역 타입 헬퍼, import 불필요
- Tailwind CSS v4: `tailwind.config.js` 없음, `globals.css`에서 `@import "tailwindcss"` 사용
- 폰트: `font.className`을 `<html>` 태그에 직접 적용
- 모든 파일: `.tsx`, 서버 컴포넌트 기본, 클라이언트 필요 시만 `'use client'`
- 린터: Biome (`pnpm lint`)
- 패키지 매니저: pnpm 전용

---

## 파일 구조

```
src/
  app/
    layout.tsx                          수정 — 폰트, 메타데이터
    globals.css                         수정 — 테마 CSS 변수
    page.tsx                            수정 — /login 리디렉트
    login/page.tsx                      신규
    onboarding/page.tsx                 신규
    markets/
      page.tsx                          신규 — 마켓 목록
      [id]/
        page.tsx                        신규 — 마켓 참여 (QR 랜딩)
        (user)/
          layout.tsx                    신규 — 유저 floating nav
          home/page.tsx                 신규
          missions/page.tsx             신규
          missions/[missionId]/page.tsx 신규
          history/page.tsx              신규
          purchases/page.tsx            신규
        (admin)/
          layout.tsx                    신규 — 관리자 floating nav
          home/page.tsx                 신규
          scan/page.tsx                 신규
          points/page.tsx               신규
          missions/page.tsx             신규
          pos/page.tsx                  신규
          users/
            page.tsx                    신규
            [userId]/page.tsx           신규
  components/
    FloatingTabBar.tsx                  신규
    MissionCard.tsx                     신규
    MissionSlot.tsx                     신규
    PointLogItem.tsx                    신규
    QRModal.tsx                         신규
    MarketCard.tsx                      신규
    ui/                                 shadcn/ui 자동 생성
  types/index.ts                        신규 — 도메인 타입
  lib/
    utils.ts                            shadcn/ui 자동 생성
    mock-data.ts                        신규 — 공용 mock 데이터
```

---

## Task 1: shadcn/ui 설치 및 프로젝트 기반 세팅

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx`
- Create: `src/types/index.ts`
- Create: `src/lib/mock-data.ts`
- Auto-generated: `src/lib/utils.ts`, `src/components/ui/*`

**Interfaces:**
- Produces: `User`, `Market`, `MarketParticipant`, `Mission`, `MissionLog`, `PointLog`, `Order`, `OrderItem` 타입
- Produces: `MOCK_MARKET`, `MOCK_USER`, `MOCK_MISSIONS`, `MOCK_POINT_LOGS`, `MOCK_ORDERS`, `MOCK_PARTICIPANTS` mock 상수

- [ ] **Step 1: shadcn/ui 초기화**

```bash
cd /path/to/dalant-market
pnpm dlx shadcn@latest init -d
```

프롬프트에서:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

완료 후 `src/lib/utils.ts`와 `src/components/ui/` 디렉토리가 생성됨을 확인.

- [ ] **Step 2: 필요한 shadcn/ui 컴포넌트 추가**

```bash
pnpm dlx shadcn@latest add button input card badge tabs select sheet avatar separator
```

- [ ] **Step 3: lucide-react 설치 확인**

shadcn/ui 설치 시 자동 포함되나, 없으면:
```bash
pnpm add lucide-react
```

- [ ] **Step 4: `src/app/globals.css` 업데이트**

```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-noto-sans-kr), system-ui, -apple-system, sans-serif;
  --color-emerald-500: #10b981;
  --color-emerald-400: #34d399;
  --color-emerald-50: #ecfdf5;
}
```

shadcn/ui init이 CSS 변수를 추가했다면 그 아래에 `@theme` 블록을 추가한다.

- [ ] **Step 5: `src/app/layout.tsx` 업데이트 — Noto Sans KR 폰트**

```tsx
import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-kr',
})

export const metadata: Metadata = {
  title: 'Dalant Market',
  description: '오프라인 모임을 위한 미션 인증 기반 포인트 마켓',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={notoSansKR.className}>
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 6: `src/app/page.tsx` — /login 리디렉트**

```tsx
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/login')
}
```

- [ ] **Step 7: `src/types/index.ts` 생성**

```ts
export type Role = 'admin' | 'user'
export type MissionType = 'upload' | 'qr' | 'admin_grant'
export type PointReasonType = 'mission' | 'purchase' | 'manual'
export type Gender = 'male' | 'female'

export interface User {
  id: string
  name: string
  realName: string
  birthDate: string
  gender: Gender
  createdAt: string
}

export interface Market {
  id: string
  title: string
  description: string
  pointLabel: string
  startsAt: string
  endsAt: string
  createdAt: string
}

export interface MarketParticipant {
  id: string
  marketId: string
  user: User
  role: Role
  balance: number
}

export interface MissionSlotData {
  slot: number
  verifiedByName: string | null
  verifiedAt: string | null
  photoUrl: string | null
}

export interface Mission {
  id: string
  marketId: string
  title: string
  type: MissionType
  isGroup: boolean
  reward: number
  limitCount: number
  activeFrom: string | null
  activeUntil: string | null
  isActive: boolean
  period: '2weeks' | '1week' | 'retreat'
  slots?: MissionSlotData[]
}

export interface PointLog {
  id: string
  marketId: string
  userId: string
  amount: number
  reasonType: PointReasonType
  missionTitle?: string
  verifiedByName?: string
  itemName?: string
  memo?: string
  createdAt: string
}

export interface OrderItem {
  name: string
  price: number
  qty: number
}

export interface Order {
  id: string
  marketId: string
  userId: string
  verifiedByName: string
  items: OrderItem[]
  total: number
  purchasedAt: string
}
```

- [ ] **Step 8: `src/lib/mock-data.ts` 생성**

```ts
import type { Market, MarketParticipant, Mission, PointLog, Order } from '@/types'

export const MOCK_MARKET: Market = {
  id: 'market-001',
  title: '2025 바울공동체 수련회',
  description: '2박 3일 수련회 달란트 마켓',
  pointLabel: '달란트',
  startsAt: '2025-08-01T09:00:00Z',
  endsAt: '2025-08-03T18:00:00Z',
  createdAt: '2025-07-01T00:00:00Z',
}

export const MOCK_PARTICIPANTS: MarketParticipant[] = [
  {
    id: 'p1',
    marketId: 'market-001',
    user: { id: 'u1', name: '김민준', realName: '김민준', birthDate: '2003-04-12', gender: 'male', createdAt: '2025-07-15T00:00:00Z' },
    role: 'user',
    balance: 28,
  },
  {
    id: 'p2',
    marketId: 'market-001',
    user: { id: 'u2', name: '이서연', realName: '이서연', birthDate: '2004-09-23', gender: 'female', createdAt: '2025-07-15T00:00:00Z' },
    role: 'user',
    balance: 34,
  },
  {
    id: 'p3',
    marketId: 'market-001',
    user: { id: 'u3', name: '박전도사', realName: '박지훈', birthDate: '1988-03-05', gender: 'male', createdAt: '2025-07-10T00:00:00Z' },
    role: 'admin',
    balance: 15,
  },
  {
    id: 'p4',
    marketId: 'market-001',
    user: { id: 'u4', name: '최예린', realName: '최예린', birthDate: '2002-11-30', gender: 'female', createdAt: '2025-07-15T00:00:00Z' },
    role: 'user',
    balance: 21,
  },
  {
    id: 'p5',
    marketId: 'market-001',
    user: { id: 'u5', name: '정승현', realName: '정승현', birthDate: '2003-07-18', gender: 'male', createdAt: '2025-07-15T00:00:00Z' },
    role: 'user',
    balance: 16,
  },
]

export const MOCK_CURRENT_USER = MOCK_PARTICIPANTS[0]

export const MOCK_MISSIONS: Mission[] = [
  {
    id: 'm1',
    marketId: 'market-001',
    title: 'QT 인증',
    type: 'admin_grant',
    isGroup: false,
    reward: 5,
    limitCount: 3,
    activeFrom: '2025-07-18T00:00:00Z',
    activeUntil: '2025-07-25T23:59:59Z',
    isActive: true,
    period: '2weeks',
    slots: [
      { slot: 1, verifiedByName: '박전도사', verifiedAt: '2025-07-18T08:30:00Z', photoUrl: null },
      { slot: 2, verifiedByName: '박전도사', verifiedAt: '2025-07-20T08:45:00Z', photoUrl: null },
      { slot: 3, verifiedByName: null, verifiedAt: null, photoUrl: null },
    ],
  },
  {
    id: 'm2',
    marketId: 'market-001',
    title: '설교노트 제출',
    type: 'upload',
    isGroup: false,
    reward: 5,
    limitCount: 1,
    activeFrom: '2025-07-18T00:00:00Z',
    activeUntil: '2025-07-27T23:59:59Z',
    isActive: true,
    period: '2weeks',
    slots: [
      { slot: 1, verifiedByName: '박전도사', verifiedAt: '2025-07-20T11:00:00Z', photoUrl: '/mock-photo.jpg' },
    ],
  },
  {
    id: 'm3',
    marketId: 'market-001',
    title: '칭찬 2마디',
    type: 'qr',
    isGroup: false,
    reward: 3,
    limitCount: 2,
    activeFrom: '2025-08-01T00:00:00Z',
    activeUntil: '2025-08-03T23:59:59Z',
    isActive: true,
    period: 'retreat',
    slots: [
      { slot: 1, verifiedByName: '이서연', verifiedAt: '2025-08-01T14:32:00Z', photoUrl: null },
      { slot: 2, verifiedByName: null, verifiedAt: null, photoUrl: null },
    ],
  },
  {
    id: 'm4',
    marketId: 'market-001',
    title: '팀원 전체 포즈샷',
    type: 'upload',
    isGroup: true,
    reward: 4,
    limitCount: 1,
    activeFrom: '2025-08-01T00:00:00Z',
    activeUntil: '2025-08-03T23:59:59Z',
    isActive: true,
    period: 'retreat',
    slots: [
      { slot: 1, verifiedByName: null, verifiedAt: null, photoUrl: null },
    ],
  },
  {
    id: 'm5',
    marketId: 'market-001',
    title: '레크레이션 1일차',
    type: 'admin_grant',
    isGroup: false,
    reward: 3,
    limitCount: 1,
    activeFrom: '2025-08-01T00:00:00Z',
    activeUntil: '2025-08-01T23:59:59Z',
    isActive: true,
    period: 'retreat',
    slots: [
      { slot: 1, verifiedByName: '김임원', verifiedAt: '2025-08-01T20:00:00Z', photoUrl: null },
    ],
  },
  {
    id: 'm6',
    marketId: 'market-001',
    title: '기도제목 나누기',
    type: 'qr',
    isGroup: false,
    reward: 3,
    limitCount: 1,
    activeFrom: '2025-08-01T00:00:00Z',
    activeUntil: '2025-08-03T23:59:59Z',
    isActive: true,
    period: 'retreat',
    slots: [
      { slot: 1, verifiedByName: null, verifiedAt: null, photoUrl: null },
    ],
  },
]

export const MOCK_POINT_LOGS: PointLog[] = [
  {
    id: 'pl1',
    marketId: 'market-001',
    userId: 'u1',
    amount: 5,
    reasonType: 'mission',
    missionTitle: 'QT 인증',
    verifiedByName: '박전도사',
    createdAt: '2025-07-18T08:30:00Z',
  },
  {
    id: 'pl2',
    marketId: 'market-001',
    userId: 'u1',
    amount: 5,
    reasonType: 'mission',
    missionTitle: '설교노트 제출',
    verifiedByName: '박전도사',
    createdAt: '2025-07-20T11:00:00Z',
  },
  {
    id: 'pl3',
    marketId: 'market-001',
    userId: 'u1',
    amount: -8,
    reasonType: 'purchase',
    itemName: '아이스크림 세트',
    createdAt: '2025-08-01T15:00:00Z',
  },
  {
    id: 'pl4',
    marketId: 'market-001',
    userId: 'u1',
    amount: 3,
    reasonType: 'mission',
    missionTitle: '칭찬 2마디',
    verifiedByName: '이서연',
    createdAt: '2025-08-01T14:32:00Z',
  },
  {
    id: 'pl5',
    marketId: 'market-001',
    userId: 'u1',
    amount: 5,
    reasonType: 'mission',
    missionTitle: 'QT 인증',
    verifiedByName: '박전도사',
    createdAt: '2025-07-20T08:45:00Z',
  },
  {
    id: 'pl6',
    marketId: 'market-001',
    userId: 'u1',
    amount: 3,
    reasonType: 'manual',
    memo: '출석 보너스',
    createdAt: '2025-08-02T09:00:00Z',
  },
  {
    id: 'pl7',
    marketId: 'market-001',
    userId: 'u1',
    amount: -5,
    reasonType: 'purchase',
    itemName: '음료수',
    createdAt: '2025-08-02T13:00:00Z',
  },
]

export const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    marketId: 'market-001',
    userId: 'u1',
    verifiedByName: '박전도사',
    items: [{ name: '아이스크림 세트', price: 5, qty: 1 }, { name: '사탕', price: 3, qty: 1 }],
    total: 8,
    purchasedAt: '2025-08-01T15:00:00Z',
  },
  {
    id: 'o2',
    marketId: 'market-001',
    userId: 'u1',
    verifiedByName: '김임원',
    items: [{ name: '음료수', price: 5, qty: 1 }],
    total: 5,
    purchasedAt: '2025-08-02T13:00:00Z',
  },
]

export const MOCK_MARKET_ITEMS = [
  { id: 'i1', name: '아이스크림 세트', price: 5 },
  { id: 'i2', name: '음료수', price: 5 },
  { id: 'i3', name: '사탕', price: 3 },
  { id: 'i4', name: '과자 세트', price: 4 },
  { id: 'i5', name: '초콜릿', price: 3 },
  { id: 'i6', name: '젤리', price: 2 },
  { id: 'i7', name: '라면', price: 4 },
  { id: 'i8', name: '컵라면', price: 3 },
]
```

- [ ] **Step 9: 빌드 확인**

```bash
pnpm build
```

오류 없이 완료되면 성공. 타입 오류가 있으면 수정.

- [ ] **Step 10: 커밋**

```bash
git add -A
git commit -m "feat: setup shadcn/ui, types, mock data, and root layout"
```

---

## Task 2: 로그인 페이지 (`/login`)

**Files:**
- Create: `src/app/login/page.tsx`

**Interfaces:**
- Consumes: 없음 (정적 페이지)
- Produces: 카카오 로그인 버튼 UI (mock — `/onboarding`으로 이동)

- [ ] **Step 1: `src/app/login/page.tsx` 생성**

```tsx
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-10">
        {/* 로고 */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500">
            <span className="text-2xl font-bold text-white">D</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Dalant Market</h1>
          <p className="text-sm text-gray-500">오프라인 모임 미션 인증 포인트 마켓</p>
        </div>

        {/* 카카오 로그인 버튼 */}
        <div className="space-y-3">
          <Link
            href="/onboarding"
            className="flex w-full items-center justify-center gap-3 rounded-full bg-[#FEE500] px-6 py-3.5 font-medium text-[#3C1E1E] transition-opacity hover:opacity-90"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 2C5.582 2 2 4.686 2 8c0 2.13 1.338 4.002 3.352 5.126L4.6 16.23a.25.25 0 0 0 .37.27l3.74-2.48A9.19 9.19 0 0 0 10 14c4.418 0 8-2.686 8-6s-3.582-6-8-6z"
                fill="#3C1E1E"
              />
            </svg>
            카카오로 시작하기
          </Link>
          <p className="text-center text-xs text-gray-400">
            로그인 시 서비스 이용약관에 동의하는 것으로 간주됩니다
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: dev 서버 실행 후 시각 확인**

```bash
pnpm dev
```

`http://localhost:3000/login` 방문. 확인사항:
- 로고, 타이틀, 설명 텍스트 표시
- 카카오 노란 버튼 표시
- 버튼 클릭 시 `/onboarding`으로 이동

- [ ] **Step 3: 커밋**

```bash
git add src/app/login/page.tsx
git commit -m "feat: add login page with kakao button"
```

---

## Task 3: 온보딩 페이지 (`/onboarding`)

**Files:**
- Create: `src/app/onboarding/page.tsx`

**Interfaces:**
- Consumes: shadcn/ui `Button`, `Input`
- Produces: 3단계 가입 폼 UI (mock — `/markets`로 이동)

- [ ] **Step 1: `src/app/onboarding/page.tsx` 생성**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft } from 'lucide-react'

type Step = 1 | 2 | 3

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | null>(null)

  function handleNext() {
    if (step < 3) setStep((s) => (s + 1) as Step)
    else router.push('/markets')
  }

  const canProceed =
    (step === 1 && name.trim().length > 0) ||
    (step === 2 && birthDate.length === 10) ||
    (step === 3 && gender !== null)

  return (
    <div className="flex min-h-svh flex-col bg-white px-6 pt-14">
      {/* 상단 뒤로가기 + 진행바 */}
      <div className="mb-8 space-y-4">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="flex items-center gap-1 text-sm text-gray-500"
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </button>
        )}
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-emerald-500' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400">{step} / 3</p>
      </div>

      {/* Step 1: 이름 */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">본명을 입력해주세요</h2>
            <p className="text-sm text-gray-500">실명으로 등록해야 미션 인증에 이름이 표시돼요</p>
          </div>
          <Input
            placeholder="홍길동"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border-gray-200 py-3 text-base"
            autoFocus
          />
        </div>
      )}

      {/* Step 2: 생일 */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">생일을 입력해주세요</h2>
            <p className="text-sm text-gray-500">생일월 미션 인증에 활용돼요</p>
          </div>
          <Input
            placeholder="YYYY-MM-DD"
            value={birthDate}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9-]/g, '')
              setBirthDate(v)
            }}
            maxLength={10}
            className="rounded-xl border-gray-200 py-3 text-base"
            autoFocus
          />
        </div>
      )}

      {/* Step 3: 성별 */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">성별을 선택해주세요</h2>
            <p className="text-sm text-gray-500">미션 매칭에 활용돼요</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['male', 'female'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`rounded-2xl border-2 py-6 text-base font-medium transition-colors ${
                  gender === g
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-100 bg-white text-gray-600'
                }`}
              >
                {g === 'male' ? '남자' : '여자'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 다음 버튼 */}
      <div className="mt-auto pb-10 pt-8">
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="w-full rounded-full bg-emerald-500 py-3 text-base font-medium text-white hover:bg-emerald-600 disabled:opacity-40"
        >
          {step === 3 ? '완료하고 시작하기' : '다음'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 시각 확인**

`http://localhost:3000/onboarding` 방문. 확인사항:
- 진행바 3단계 표시
- 이름 → 생일 → 성별 순 전환
- 각 단계 입력 없으면 "다음" 버튼 비활성
- Step 3 완료 후 `/markets`로 이동

- [ ] **Step 3: 커밋**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat: add 3-step onboarding page"
```

---

## Task 4: 마켓 목록 + 마켓 참여 페이지

**Files:**
- Create: `src/components/MarketCard.tsx`
- Create: `src/app/markets/page.tsx`
- Create: `src/app/markets/[id]/page.tsx`

**Interfaces:**
- Consumes: `Market` 타입, `MOCK_MARKET`
- Produces: 마켓 카드 컴포넌트, 목록 화면, QR 랜딩 화면

- [ ] **Step 1: `src/components/MarketCard.tsx` 생성**

```tsx
import Link from 'next/link'
import { Calendar, Users } from 'lucide-react'
import type { Market } from '@/types'

interface MarketCardProps {
  market: Market
  participantCount: number
  isJoined: boolean
}

export function MarketCard({ market, participantCount, isJoined }: MarketCardProps) {
  const startDate = new Date(market.startsAt).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })
  const endDate = new Date(market.endsAt).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      <div className="space-y-1">
        <h3 className="font-bold text-gray-900 text-base">{market.title}</h3>
        {market.description && (
          <p className="text-sm text-gray-500">{market.description}</p>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {startDate} ~ {endDate}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {participantCount}명
        </span>
      </div>
      <Link
        href={`/markets/${market.id}/${isJoined ? '(user)/home' : ''}`}
        className={`flex w-full items-center justify-center rounded-full py-2.5 text-sm font-medium transition-colors ${
          isJoined
            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
            : 'border border-emerald-500 text-emerald-600 hover:bg-emerald-50'
        }`}
      >
        {isJoined ? '입장하기' : '참여하기'}
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: `src/app/markets/page.tsx` 생성**

```tsx
import { MarketCard } from '@/components/MarketCard'
import { MOCK_MARKET, MOCK_PARTICIPANTS } from '@/lib/mock-data'

export default function MarketsPage() {
  return (
    <div className="min-h-svh bg-gray-50 px-4 pt-14 pb-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900">마켓</h1>
          <p className="text-sm text-gray-500">참여 가능한 행사를 선택하세요</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            참여 중인 마켓
          </h2>
          <MarketCard
            market={MOCK_MARKET}
            participantCount={MOCK_PARTICIPANTS.length}
            isJoined={true}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            참여 가능한 마켓
          </h2>
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-400">다른 활성 마켓이 없어요</p>
            <p className="mt-1 text-xs text-gray-400">QR 코드를 스캔해서 참여할 수 있어요</p>
          </div>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: `src/app/markets/[id]/page.tsx` 생성 — QR 랜딩**

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MOCK_MARKET, MOCK_PARTICIPANTS } from '@/lib/mock-data'
import { Calendar, Users } from 'lucide-react'

export default async function MarketJoinPage(props: PageProps<'/markets/[id]'>) {
  const { id } = await props.params
  const market = MOCK_MARKET

  const startDate = new Date(market.startsAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  const endDate = new Date(market.endsAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500">
            <span className="text-2xl font-bold text-white">D</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{market.title}</h1>
          {market.description && (
            <p className="text-sm text-gray-500">{market.description}</p>
          )}
        </div>

        <div className="rounded-2xl bg-gray-50 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <span>{startDate} ~ {endDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4 text-emerald-500" />
            <span>현재 {MOCK_PARTICIPANTS.length}명 참여 중</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link href={`/markets/${id}/(user)/home`}>
            <Button className="w-full rounded-full bg-emerald-500 py-3 text-base font-medium text-white hover:bg-emerald-600">
              마켓 참여하기
            </Button>
          </Link>
          <Link href="/login" className="flex justify-center text-sm text-gray-400 hover:text-gray-600">
            다른 계정으로 로그인
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 시각 확인**

- `http://localhost:3000/markets` — 마켓 목록 확인
- `http://localhost:3000/markets/market-001` — QR 랜딩 확인

- [ ] **Step 5: 커밋**

```bash
git add src/components/MarketCard.tsx src/app/markets/
git commit -m "feat: add markets list and market join pages"
```

---

## Task 5: FloatingTabBar 컴포넌트

**Files:**
- Create: `src/components/FloatingTabBar.tsx`

**Interfaces:**
- Consumes: `tabs: { label: string; href: string; icon: React.ElementType }[]`
- Produces: `<FloatingTabBar tabs={...} />` — user/admin 레이아웃에서 사용

- [ ] **Step 1: `src/components/FloatingTabBar.tsx` 생성**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface TabItem {
  label: string
  segment: string
  href: string
  icon: LucideIcon
}

interface FloatingTabBarProps {
  tabs: TabItem[]
}

export function FloatingTabBar({ tabs }: FloatingTabBarProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg">
      <div className="flex items-center justify-around rounded-full border border-gray-100 bg-white px-2 py-2 shadow-2xl">
        {tabs.map((tab) => {
          const isActive = pathname.includes(tab.segment)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex min-w-[56px] flex-col items-center gap-0.5 rounded-full px-3 py-2 transition-colors',
                isActive ? 'text-emerald-500' : 'text-gray-400 hover:text-gray-600',
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={cn('text-[10px] font-medium leading-tight', isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden')}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/FloatingTabBar.tsx
git commit -m "feat: add FloatingTabBar component"
```

---

## Task 6: 유저 레이아웃 + 홈

**Files:**
- Create: `src/app/markets/[id]/(user)/layout.tsx`
- Create: `src/app/markets/[id]/(user)/home/page.tsx`

**Interfaces:**
- Consumes: `FloatingTabBar`, `MOCK_CURRENT_USER`, `MOCK_MARKET`, `MOCK_POINT_LOGS`
- Produces: 유저 레이아웃 (floating nav 포함), 홈 화면

- [ ] **Step 1: `src/app/markets/[id]/(user)/layout.tsx` 생성**

```tsx
import { FloatingTabBar } from '@/components/FloatingTabBar'
import { Home, ListTodo, History, User } from 'lucide-react'

export default async function UserLayout(props: LayoutProps<'/markets/[id]/(user)'>) {
  const { id } = await props.params

  const tabs = [
    { label: '홈', segment: 'home', href: `/markets/${id}/home`, icon: Home },
    { label: '미션', segment: 'missions', href: `/markets/${id}/missions`, icon: ListTodo },
    { label: '내역', segment: 'history', href: `/markets/${id}/history`, icon: History },
    { label: '마이', segment: 'purchases', href: `/markets/${id}/purchases`, icon: User },
  ]

  return (
    <div className="min-h-svh bg-white">
      <main className="pb-28">{props.children}</main>
      <FloatingTabBar tabs={tabs} />
    </div>
  )
}
```

- [ ] **Step 2: `src/app/markets/[id]/(user)/home/page.tsx` 생성**

```tsx
import Link from 'next/link'
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { MOCK_CURRENT_USER, MOCK_MARKET, MOCK_POINT_LOGS } from '@/lib/mock-data'

export default async function UserHomePage(props: PageProps<'/markets/[id]/(user)/home'>) {
  const { id } = await props.params
  const user = MOCK_CURRENT_USER
  const market = MOCK_MARKET
  const recentLogs = MOCK_POINT_LOGS.slice(0, 3)

  return (
    <div className="px-4 pt-14 space-y-6 max-w-lg mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{market.title}</p>
          <h1 className="text-lg font-bold text-gray-900">{user.user.realName}</h1>
        </div>
      </div>

      {/* 잔액 카드 */}
      <div className="rounded-3xl bg-emerald-500 p-6 text-white space-y-1">
        <p className="text-sm font-medium opacity-80">보유 {market.pointLabel}</p>
        <p className="text-4xl font-bold tabular-nums">{user.balance}</p>
        <p className="text-sm opacity-70">{market.pointLabel}</p>
      </div>

      {/* 최근 내역 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">최근 내역</h2>
          <Link
            href={`/markets/${id}/history`}
            className="flex items-center gap-1 text-xs text-emerald-500"
          >
            전체 보기 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="divide-y divide-gray-50 rounded-2xl border border-gray-100 bg-white overflow-hidden">
          {recentLogs.map((log) => {
            const label =
              log.reasonType === 'mission'
                ? log.missionTitle
                : log.reasonType === 'purchase'
                ? log.itemName
                : log.memo ?? '수동 지급'

            const isPositive = log.amount > 0

            return (
              <div key={log.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isPositive ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-rose-500" />
                    )}
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
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 시각 확인**

`http://localhost:3000/markets/market-001/home` 방문.
확인사항:
- 에메랄드 잔액 카드, 이름/마켓명 표시
- 최근 내역 3건 (적립 green, 차감 red)
- 하단 floating pill 탭바 표시

- [ ] **Step 4: 커밋**

```bash
git add src/app/markets/
git commit -m "feat: add user layout with floating nav and home page"
```

---

## Task 7: 유저 미션 목록

**Files:**
- Create: `src/components/MissionCard.tsx`
- Create: `src/app/markets/[id]/(user)/missions/page.tsx`

**Interfaces:**
- Consumes: `Mission` 타입, `MOCK_MISSIONS`
- Produces: `<MissionCard mission={...} marketId={string} />`, 미션 목록 화면

- [ ] **Step 1: `src/components/MissionCard.tsx` 생성**

```tsx
import Link from 'next/link'
import { CheckCircle2, Clock, Circle } from 'lucide-react'
import type { Mission } from '@/types'
import { cn } from '@/lib/utils'

interface MissionCardProps {
  mission: Mission
  marketId: string
}

function getMissionStatus(mission: Mission): 'completed' | 'partial' | 'pending' {
  if (!mission.slots) return 'pending'
  const completed = mission.slots.filter((s) => s.verifiedAt !== null).length
  if (completed === 0) return 'pending'
  if (completed === mission.limitCount) return 'completed'
  return 'partial'
}

const TYPE_LABEL: Record<string, string> = {
  upload: '사진+QR',
  qr: 'QR 즉시',
  admin_grant: '관리자 지급',
}

export function MissionCard({ mission, marketId }: MissionCardProps) {
  const status = getMissionStatus(mission)
  const completedCount = mission.slots?.filter((s) => s.verifiedAt !== null).length ?? 0

  return (
    <Link href={`/markets/${marketId}/missions/${mission.id}`}>
      <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3 active:scale-[0.99] transition-transform">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-gray-900">{mission.title}</span>
              {mission.isGroup && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">단체</span>
              )}
            </div>
            <p className="text-xs text-gray-400">{TYPE_LABEL[mission.type]}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-sm font-bold text-emerald-500">+{mission.reward}</span>
            {status === 'completed' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : status === 'partial' ? (
              <Clock className="h-5 w-5 text-amber-400" />
            ) : (
              <Circle className="h-5 w-5 text-gray-200" />
            )}
          </div>
        </div>

        {/* 슬롯 미니 표시 */}
        {mission.limitCount > 1 && (
          <div className="flex gap-1.5">
            {mission.slots?.map((slot) => (
              <div
                key={slot.slot}
                className={cn(
                  'h-1.5 flex-1 rounded-full',
                  slot.verifiedAt ? 'bg-emerald-500' : 'bg-gray-100',
                )}
              />
            ))}
          </div>
        )}

        {mission.limitCount > 1 && (
          <p className="text-xs text-gray-400">{completedCount}/{mission.limitCount}회 완료</p>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: `src/app/markets/[id]/(user)/missions/page.tsx` 생성**

```tsx
import { MissionCard } from '@/components/MissionCard'
import { MOCK_MISSIONS } from '@/lib/mock-data'

type Period = '2weeks' | '1week' | 'retreat'

const PERIOD_LABEL: Record<Period, string> = {
  '2weeks': '2주 전',
  '1week': '1주 전',
  retreat: '수련회',
}

export default async function MissionsPage(props: PageProps<'/markets/[id]/(user)/missions'>) {
  const { id } = await props.params
  const searchParams = await props.searchParams
  const period = (searchParams?.period as Period) ?? 'retreat'

  const filtered = MOCK_MISSIONS.filter((m) => m.period === period)

  return (
    <div className="px-4 pt-14 pb-4 space-y-5 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900">미션</h1>

      {/* 구간 탭 */}
      <div className="flex gap-2">
        {(['2weeks', '1week', 'retreat'] as Period[]).map((p) => (
          <a
            key={p}
            href={`/markets/${id}/missions?period=${p}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              period === p
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {PERIOD_LABEL[p]}
          </a>
        ))}
      </div>

      {/* 미션 목록 */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">이 구간에 미션이 없어요</div>
        ) : (
          filtered.map((mission) => (
            <MissionCard key={mission.id} mission={mission} marketId={id} />
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 시각 확인**

`http://localhost:3000/markets/market-001/missions` 방문.
확인사항:
- 구간 탭 (2주 전/1주 전/수련회) 선택 및 필터링
- 미션 카드에 제목, 리워드, 상태 아이콘
- 다회 미션에 슬롯 진행 바
- 탭 클릭 시 해당 미션만 표시

- [ ] **Step 4: 커밋**

```bash
git add src/components/MissionCard.tsx src/app/markets/market-001/missions/ src/app/markets/
git commit -m "feat: add mission list page with period tabs and MissionCard"
```

---

## Task 8: 유저 미션 상세

**Files:**
- Create: `src/components/MissionSlot.tsx`
- Create: `src/components/QRModal.tsx`
- Create: `src/app/markets/[id]/(user)/missions/[missionId]/page.tsx`

**Interfaces:**
- Consumes: `Mission`, `MissionSlotData` 타입, `MOCK_MISSIONS`
- Produces: `<MissionSlot slot={...} />`, `<QRModal />`, 미션 상세 화면

- [ ] **Step 1: `src/components/MissionSlot.tsx` 생성**

```tsx
import { CheckCircle2, QrCode } from 'lucide-react'
import type { MissionSlotData } from '@/types'

interface MissionSlotProps {
  slot: MissionSlotData
  slotNumber: number
}

export function MissionSlot({ slot, slotNumber }: MissionSlotProps) {
  const isVerified = slot.verifiedAt !== null

  return (
    <div
      className={`rounded-2xl border p-4 space-y-2 ${
        isVerified ? 'border-emerald-100 bg-emerald-50' : 'border-gray-100 bg-white'
      }`}
    >
      <p className="text-xs font-medium text-gray-400">{slotNumber}회차</p>
      {isVerified ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-700">{slot.verifiedByName} 확인</span>
          </div>
          <p className="text-xs text-gray-500">
            {new Date(slot.verifiedAt!).toLocaleString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-gray-400">
          <QrCode className="h-4 w-4" />
          <span className="text-sm">QR 대기중</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: `src/components/QRModal.tsx` 생성**

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { QrCode, X } from 'lucide-react'

interface QRModalProps {
  missionTitle: string
  disabled?: boolean
}

export function QRModal({ missionTitle, disabled = false }: QRModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="w-full rounded-full bg-emerald-500 py-3 text-base font-medium text-white hover:bg-emerald-600 disabled:opacity-40"
      >
        <QrCode className="mr-2 h-5 w-5" />
        QR 생성하기
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{missionTitle}</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mock QR — 실제 구현 시 qrcode 라이브러리로 교체 */}
            <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
              <div className="text-center space-y-2">
                <QrCode className="mx-auto h-16 w-16 text-gray-300" />
                <p className="text-xs text-gray-400">QR 코드</p>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 px-4 py-3 text-center">
              <p className="text-sm font-medium text-amber-700">5분 후 만료됩니다</p>
              <p className="text-xs text-amber-600 mt-0.5">상대방 카메라로 스캔해주세요</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: `src/app/markets/[id]/(user)/missions/[missionId]/page.tsx` 생성**

```tsx
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ChevronLeft, Upload, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { MissionSlot } from '@/components/MissionSlot'
import { QRModal } from '@/components/QRModal'
import { MOCK_MISSIONS } from '@/lib/mock-data'

const TYPE_LABEL: Record<string, string> = {
  upload: '사진 업로드 후 QR 인증',
  qr: 'QR 즉시 인증',
  admin_grant: '관리자 일괄 지급',
}

export default function MissionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const missionId = params.missionId as string
  const [photoUploaded, setPhotoUploaded] = useState(false)

  const mission = MOCK_MISSIONS.find((m) => m.id === missionId) ?? MOCK_MISSIONS[0]
  const nextPendingSlot = mission.slots?.find((s) => s.verifiedAt === null)

  return (
    <div className="min-h-svh bg-white">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-4">
        <Link href={`/markets/${id}/missions`} className="text-gray-400">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{mission.title}</h1>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-6">
        {/* 미션 정보 */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{TYPE_LABEL[mission.type]}</span>
            <span className="text-lg font-bold text-emerald-500">+{mission.reward} 달란트</span>
          </div>
          {mission.isGroup && (
            <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              단체 미션
            </span>
          )}
        </div>

        {/* 인증 UI */}
        {mission.type === 'admin_grant' ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center space-y-2">
            <CheckCircle2 className="mx-auto h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">관리자가 일괄 지급하는 미션이에요</p>
            <p className="text-xs text-gray-400">별도 인증 없이 자동으로 달란트가 적립됩니다</p>
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
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    사진 업로드 완료
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    사진 업로드
                  </>
                )}
              </button>
            )}

            {nextPendingSlot && (
              <QRModal
                missionTitle={mission.title}
                disabled={mission.type === 'upload' && !photoUploaded}
              />
            )}

            {mission.type === 'upload' && !photoUploaded && (
              <p className="text-center text-xs text-gray-400">사진을 업로드해야 QR을 생성할 수 있어요</p>
            )}
          </div>
        )}

        {/* 슬롯 목록 */}
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
  )
}
```

- [ ] **Step 4: 시각 확인**

`http://localhost:3000/markets/market-001/missions/m2` (타입 A), `m3` (타입 B), `m1` (타입 C) 방문.
확인사항:
- 타입 A: 사진 업로드 버튼 → 완료 후 QR 활성화
- 타입 B: 바로 QR 활성
- 타입 C: "관리자 일괄 지급" 안내
- QR 버튼 클릭 시 모달 표시, 5분 만료 안내
- 슬롯 카드 완료/대기 상태 표시

- [ ] **Step 5: 커밋**

```bash
git add src/components/MissionSlot.tsx src/components/QRModal.tsx src/app/markets/
git commit -m "feat: add mission detail page with slot UI and QR modal"
```

---

## Task 9: 유저 달란트 내역 + 구매 내역

**Files:**
- Create: `src/components/PointLogItem.tsx`
- Create: `src/app/markets/[id]/(user)/history/page.tsx`
- Create: `src/app/markets/[id]/(user)/purchases/page.tsx`

**Interfaces:**
- Consumes: `PointLog`, `Order` 타입, `MOCK_POINT_LOGS`, `MOCK_ORDERS`
- Produces: `<PointLogItem log={...} />`, 달란트 내역 화면, 구매 내역 화면

- [ ] **Step 1: `src/components/PointLogItem.tsx` 생성**

```tsx
import { TrendingUp, TrendingDown, Award } from 'lucide-react'
import type { PointLog } from '@/types'

interface PointLogItemProps {
  log: PointLog
}

export function PointLogItem({ log }: PointLogItemProps) {
  const isPositive = log.amount > 0

  const label =
    log.reasonType === 'mission'
      ? log.missionTitle ?? '미션'
      : log.reasonType === 'purchase'
      ? log.itemName ?? '구매'
      : log.memo ?? '수동 지급'

  const sub =
    log.reasonType === 'mission' && log.verifiedByName
      ? `${log.verifiedByName} 인증`
      : log.reasonType === 'purchase'
      ? '마켓 구매'
      : '관리자 지급'

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            isPositive
              ? log.reasonType === 'manual'
                ? 'bg-purple-50'
                : 'bg-emerald-50'
              : 'bg-rose-50'
          }`}
        >
          {isPositive ? (
            log.reasonType === 'manual' ? (
              <Award className="h-4 w-4 text-purple-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            )
          ) : (
            <TrendingDown className="h-4 w-4 text-rose-500" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-xs text-gray-400">{sub}</p>
          <p className="text-xs text-gray-300">
            {new Date(log.createdAt).toLocaleString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
      <span
        className={`text-sm font-bold tabular-nums ${
          isPositive
            ? log.reasonType === 'manual'
              ? 'text-purple-500'
              : 'text-emerald-500'
            : 'text-rose-500'
        }`}
      >
        {isPositive ? '+' : ''}{log.amount}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: `src/app/markets/[id]/(user)/history/page.tsx` 생성**

```tsx
import { PointLogItem } from '@/components/PointLogItem'
import { MOCK_POINT_LOGS, MOCK_CURRENT_USER } from '@/lib/mock-data'

export default async function HistoryPage(props: PageProps<'/markets/[id]/(user)/history'>) {
  await props.params
  const balance = MOCK_CURRENT_USER.balance

  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-5">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-gray-900">달란트 내역</h1>
        <span className="text-sm text-gray-500">잔액 <span className="font-bold text-emerald-500">{balance}</span></span>
      </div>

      <div className="divide-y divide-gray-50">
        {MOCK_POINT_LOGS.map((log) => (
          <PointLogItem key={log.id} log={log} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: `src/app/markets/[id]/(user)/purchases/page.tsx` 생성**

```tsx
import { MOCK_ORDERS } from '@/lib/mock-data'
import { ShoppingBag } from 'lucide-react'

export default async function PurchasesPage(props: PageProps<'/markets/[id]/(user)/purchases'>) {
  await props.params

  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">구매 내역</h1>

      <div className="space-y-3">
        {MOCK_ORDERS.map((order) => (
          <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-400">
                  {new Date(order.purchasedAt).toLocaleString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <span className="text-sm font-bold text-rose-500 tabular-nums">-{order.total} 달란트</span>
            </div>

            <div className="space-y-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.name} × {item.qty}</span>
                  <span className="text-gray-500 tabular-nums">{item.price * item.qty}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-50 pt-2 text-right text-xs text-gray-400">
              {order.verifiedByName} 처리
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 시각 확인**

- `/markets/market-001/history` — 타임라인, 색상 구분 확인
- `/markets/market-001/purchases` — 구매 카드, 물품 목록 확인

- [ ] **Step 5: 커밋**

```bash
git add src/components/PointLogItem.tsx src/app/markets/
git commit -m "feat: add point history and purchase history pages"
```

---

## Task 10: 관리자 레이아웃 + 홈

**Files:**
- Create: `src/app/markets/[id]/(admin)/layout.tsx`
- Create: `src/app/markets/[id]/(admin)/home/page.tsx`

**Interfaces:**
- Consumes: `FloatingTabBar`, `MOCK_PARTICIPANTS`, `MOCK_MARKET`
- Produces: 관리자 레이아웃 (floating nav), 관리자 홈 화면

- [ ] **Step 1: `src/app/markets/[id]/(admin)/layout.tsx` 생성**

```tsx
import { FloatingTabBar } from '@/components/FloatingTabBar'
import { Home, QrCode, Wallet, ListTodo, Users } from 'lucide-react'

export default async function AdminLayout(props: LayoutProps<'/markets/[id]/(admin)'>) {
  const { id } = await props.params

  const tabs = [
    { label: '홈', segment: 'home', href: `/markets/${id}/home`, icon: Home },
    { label: '스캔', segment: 'scan', href: `/markets/${id}/scan`, icon: QrCode },
    { label: '달란트', segment: 'points', href: `/markets/${id}/points`, icon: Wallet },
    { label: '미션', segment: 'missions', href: `/markets/${id}/missions`, icon: ListTodo },
    { label: '유저', segment: 'users', href: `/markets/${id}/users`, icon: Users },
  ]

  return (
    <div className="min-h-svh bg-white">
      <main className="pb-28">{props.children}</main>
      <FloatingTabBar tabs={tabs} />
    </div>
  )
}
```

- [ ] **Step 2: `src/app/markets/[id]/(admin)/home/page.tsx` 생성**

```tsx
import Link from 'next/link'
import { QrCode } from 'lucide-react'
import { MOCK_MARKET, MOCK_PARTICIPANTS } from '@/lib/mock-data'

export default async function AdminHomePage(props: PageProps<'/markets/[id]/(admin)/home'>) {
  const { id } = await props.params

  const sorted = [...MOCK_PARTICIPANTS].sort((a, b) => b.balance - a.balance)

  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">관리자</p>
          <h1 className="text-xl font-bold text-gray-900">{MOCK_MARKET.title}</h1>
        </div>
      </div>

      {/* QR 스캔 버튼 */}
      <Link
        href={`/markets/${id}/scan`}
        className="flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 py-5 text-lg font-bold text-white shadow-lg shadow-emerald-200 transition-transform active:scale-95"
      >
        <QrCode className="h-7 w-7" />
        QR 스캔
      </Link>

      {/* 참여자 현황 테이블 */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">참여자 달란트 현황</h2>
        <div className="overflow-hidden rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3 text-right">잔액</th>
                <th className="px-4 py-3 text-right">역할</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.user.realName}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-500">
                    {p.balance}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.role === 'admin' ? (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
                        관리자
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">유저</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 시각 확인**

`http://localhost:3000/markets/market-001/(admin)/home` 방문.
(실제 URL은 route group 제거: `http://localhost:3000/markets/market-001/home` — 단, admin layout이 적용되어야 함. 개발 단계에서는 admin URL을 별도 확인.)
확인사항:
- "관리자" 배지, 마켓명 표시
- 큰 에메랄드 QR 스캔 버튼
- 참여자 테이블, 잔액 순 정렬
- 하단 5개 탭 floating nav

- [ ] **Step 4: 커밋**

```bash
git add src/app/markets/
git commit -m "feat: add admin layout with 5-tab nav and admin home page"
```

---

## Task 11: 관리자 QR 스캔

**Files:**
- Create: `src/app/markets/[id]/(admin)/scan/page.tsx`

**Interfaces:**
- Consumes: `MOCK_MISSIONS`, `MOCK_PARTICIPANTS`
- Produces: 카메라 뷰파인더 UI + 스캔 결과 시트

- [ ] **Step 1: `src/app/markets/[id]/(admin)/scan/page.tsx` 생성**

```tsx
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { QrCode, CheckCircle2, X, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MOCK_MISSIONS, MOCK_PARTICIPANTS } from '@/lib/mock-data'

type ScanState = 'idle' | 'scanned' | 'group' | 'done'

export default function ScanPage() {
  const params = useParams()
  const [state, setState] = useState<ScanState>('idle')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const mockMission = MOCK_MISSIONS[2]
  const otherParticipants = MOCK_PARTICIPANTS.filter((p) => p.user.id !== 'u1')

  function handleMockScan() {
    setState('scanned')
  }

  function handleConfirm() {
    if (mockMission.isGroup) {
      setState('group')
    } else {
      setState('done')
    }
  }

  function handleGroupConfirm() {
    setState('done')
  }

  function toggleUser(userId: string) {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  return (
    <div className="relative flex min-h-svh flex-col bg-black">
      {/* 뷰파인더 */}
      <div className="relative flex flex-1 items-center justify-center">
        <div className="flex h-64 w-64 items-center justify-center rounded-3xl border-4 border-white/30">
          <QrCode className="h-24 w-24 text-white/20" />
        </div>
        <p className="absolute bottom-32 text-sm text-white/70">QR 코드를 화면 중앙에 맞춰주세요</p>

        {/* Mock 스캔 트리거 */}
        {state === 'idle' && (
          <button
            type="button"
            onClick={handleMockScan}
            className="absolute bottom-16 rounded-full bg-white/20 px-6 py-3 text-sm text-white"
          >
            스캔 시뮬레이션
          </button>
        )}
      </div>

      {/* 스캔 결과 시트 */}
      {state === 'scanned' && (
        <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-6 space-y-5">
          <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400">미션 인증 요청</p>
            <h3 className="text-lg font-bold text-gray-900">{mockMission.title}</h3>
            <p className="text-sm text-gray-500">
              김민준 · +{mockMission.reward} 달란트
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setState('idle')}
              className="flex-1 rounded-full"
            >
              취소
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
            >
              확인
            </Button>
          </div>
        </div>
      )}

      {/* 단체 미션 참여자 선택 */}
      {state === 'group' && (
        <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-6 space-y-5">
          <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-gray-900">단체 미션 — 참여자 추가</h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {otherParticipants.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleUser(p.user.id)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm transition-colors ${
                  selectedUsers.includes(p.user.id)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-50 text-gray-700'
                }`}
              >
                <span>{p.user.realName}</span>
                {selectedUsers.includes(p.user.id) && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </button>
            ))}
          </div>
          <Button
            onClick={handleGroupConfirm}
            className="w-full rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
          >
            {selectedUsers.length > 0
              ? `${selectedUsers.length + 1}명 달란트 적립`
              : '본인만 적립'}
          </Button>
        </div>
      )}

      {/* 완료 */}
      {state === 'done' && (
        <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-6 space-y-5 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <div>
            <p className="text-lg font-bold text-gray-900">달란트 적립 완료!</p>
            <p className="text-sm text-gray-500 mt-1">
              {mockMission.title} · +{mockMission.reward} 달란트
            </p>
          </div>
          <Button
            onClick={() => { setState('idle'); setSelectedUsers([]) }}
            className="w-full rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
          >
            다음 스캔
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 시각 확인**

관리자 스캔 페이지 방문. 확인사항:
- 검은 배경 카메라 뷰파인더
- "스캔 시뮬레이션" 클릭 → 결과 시트 슬라이드업
- 확인 → 단체 미션 참여자 선택 → 완료

- [ ] **Step 3: 커밋**

```bash
git add src/app/markets/
git commit -m "feat: add admin QR scan page with mock scan flow"
```

---

## Task 12: 관리자 달란트 수동 관리

**Files:**
- Create: `src/app/markets/[id]/(admin)/points/page.tsx`

**Interfaces:**
- Consumes: `MOCK_PARTICIPANTS`
- Produces: 수동 지급/차감 폼 UI

- [ ] **Step 1: `src/app/markets/[id]/(admin)/points/page.tsx` 생성**

```tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import { MOCK_PARTICIPANTS } from '@/lib/mock-data'

type Mode = 'grant' | 'deduct'

export default function PointsManagePage() {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [mode, setMode] = useState<Mode>('grant')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const selectedUser = MOCK_PARTICIPANTS.find((p) => p.user.id === selectedUserId)
  const canSubmit = selectedUserId && Number(amount) > 0

  function handleSubmit() {
    if (!canSubmit) return
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setAmount('')
      setMemo('')
      setSelectedUserId('')
    }, 2000)
  }

  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">달란트 수동 관리</h1>

      {/* 유저 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">참여자 선택</label>
        <div className="grid grid-cols-2 gap-2">
          {MOCK_PARTICIPANTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedUserId(p.user.id)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                selectedUserId === p.user.id
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-100 bg-white text-gray-700'
              }`}
            >
              <p className="font-medium">{p.user.realName}</p>
              <p className="text-xs text-gray-400">잔액 {p.balance}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 지급/차감 토글 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">처리 유형</label>
        <div className="flex gap-2">
          {(['grant', 'deduct'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-colors ${
                mode === m
                  ? m === 'grant'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {m === 'grant' ? '지급' : '차감'}
            </button>
          ))}
        </div>
      </div>

      {/* 금액 입력 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">달란트 수량</label>
        <Input
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          className="rounded-xl text-base"
        />
        {selectedUser && amount && (
          <p className="text-xs text-gray-400">
            처리 후 잔액: {mode === 'grant' ? selectedUser.balance + Number(amount) : selectedUser.balance - Number(amount)} 달란트
          </p>
        )}
      </div>

      {/* 사유 메모 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">사유 (선택)</label>
        <Input
          placeholder="예: 출석 보너스, 미션 취소 등"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="rounded-xl"
        />
      </div>

      {/* 제출 */}
      {submitted ? (
        <div className="flex items-center justify-center gap-2 rounded-full bg-emerald-50 py-3 text-sm font-medium text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          처리 완료
        </div>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full rounded-full py-3 text-base font-medium text-white disabled:opacity-40 ${
            mode === 'grant' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
          }`}
        >
          {mode === 'grant' ? '달란트 지급' : '달란트 차감'}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 시각 확인**

관리자 달란트 관리 페이지 방문. 확인사항:
- 참여자 선택 그리드
- 지급/차감 토글 (색상 변경)
- 처리 후 예상 잔액 표시
- 제출 시 완료 피드백

- [ ] **Step 3: 커밋**

```bash
git add src/app/markets/
git commit -m "feat: add admin points manual management page"
```

---

## Task 13: 관리자 미션 관리

**Files:**
- Create: `src/app/markets/[id]/(admin)/missions/page.tsx`

**Interfaces:**
- Consumes: `Mission` 타입, `MOCK_MISSIONS`
- Produces: 미션 목록 + 토글 + 추가 폼

- [ ] **Step 1: `src/app/markets/[id]/(admin)/missions/page.tsx` 생성**

```tsx
'use client'

import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MOCK_MISSIONS } from '@/lib/mock-data'
import type { Mission, MissionType } from '@/types'

const TYPE_LABEL: Record<MissionType, string> = {
  upload: '사진+QR',
  qr: 'QR 즉시',
  admin_grant: '관리자 지급',
}

export default function AdminMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>(MOCK_MISSIONS)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function toggleActive(id: string) {
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m)),
    )
  }

  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">미션 관리</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
        >
          <Plus className="mr-1 h-4 w-4" />
          미션 추가
        </Button>
      </div>

      {/* 추가 폼 (간략) */}
      {showForm && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-emerald-700">새 미션</h3>
          <Input placeholder="미션 이름" className="rounded-xl bg-white" />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="달란트 수량" type="number" className="rounded-xl bg-white" />
            <Input placeholder="최대 횟수" type="number" className="rounded-xl bg-white" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600">
              추가
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="rounded-full">
              취소
            </Button>
          </div>
        </div>
      )}

      {/* 미션 목록 */}
      <div className="space-y-2">
        {missions.map((mission) => (
          <div key={mission.id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === mission.id ? null : mission.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${mission.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                      {mission.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {TYPE_LABEL[mission.type]} · +{mission.reward} · {mission.limitCount}회
                    </p>
                  </div>
                  {expandedId === mission.id ? (
                    <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                  )}
                </button>
              </div>

              {/* 활성화 토글 */}
              <button
                type="button"
                onClick={() => toggleActive(mission.id)}
                className={`relative ml-3 h-6 w-11 shrink-0 rounded-full transition-colors ${
                  mission.isActive ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    mission.isActive ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* 확장 상세 */}
            {expandedId === mission.id && (
              <div className="border-t border-gray-50 px-4 py-3 bg-gray-50 grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <p className="text-gray-400">타입</p>
                  <p className="font-medium">{TYPE_LABEL[mission.type]}</p>
                </div>
                <div>
                  <p className="text-gray-400">달란트</p>
                  <p className="font-medium">+{mission.reward}</p>
                </div>
                <div>
                  <p className="text-gray-400">최대 횟수</p>
                  <p className="font-medium">{mission.limitCount}회</p>
                </div>
                <div>
                  <p className="text-gray-400">단체 미션</p>
                  <p className="font-medium">{mission.isGroup ? '예' : '아니오'}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 시각 확인**

관리자 미션 관리 페이지. 확인사항:
- 미션 목록 + 활성화 토글 동작
- "미션 추가" 버튼 → 폼 표시/숨김
- 미션 카드 확장 → 상세 정보

- [ ] **Step 3: 커밋**

```bash
git add src/app/markets/
git commit -m "feat: add admin missions management page"
```

---

## Task 14: 관리자 마켓 POS

**Files:**
- Create: `src/app/markets/[id]/(admin)/pos/page.tsx`

**Interfaces:**
- Consumes: `MOCK_MARKET_ITEMS`
- Produces: 물품 탭탭 선택 + 합산 + QR 결제 흐름

- [ ] **Step 1: `src/app/markets/[id]/(admin)/pos/page.tsx` 생성**

```tsx
'use client'

import { useState } from 'react'
import { Plus, Minus, QrCode, CheckCircle2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MOCK_MARKET_ITEMS, MOCK_MARKET } from '@/lib/mock-data'

interface CartItem {
  id: string
  name: string
  price: number
  qty: number
}

type PosState = 'shopping' | 'scanning' | 'done'

export default function PosPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [posState, setPosState] = useState<PosState>('shopping')

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  function addItem(item: (typeof MOCK_MARKET_ITEMS)[0]) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id)
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
      }
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function changeQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0),
    )
  }

  function handleScan() {
    setPosState('scanning')
    setTimeout(() => setPosState('done'), 2000)
  }

  function reset() {
    setCart([])
    setPosState('shopping')
  }

  return (
    <div className="min-h-svh bg-gray-50 flex flex-col">
      <div className="px-4 pt-14 max-w-lg mx-auto w-full space-y-5 flex-1">
        <h1 className="text-xl font-bold text-gray-900">마켓 POS</h1>

        {/* 물품 그리드 */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MOCK_MARKET_ITEMS.map((item) => {
            const cartItem = cart.find((c) => c.id === item.id)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => addItem(item)}
                className="relative rounded-2xl border border-gray-100 bg-white p-4 text-left active:scale-95 transition-transform"
              >
                {cartItem && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                    {cartItem.qty}
                  </span>
                )}
                <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                <p className="text-xs text-emerald-500 font-bold">{item.price} 달란트</p>
              </button>
            )
          })}
        </div>

        {/* 장바구니 */}
        {cart.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">선택 목록</h2>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => changeQty(item.id, -1)} className="rounded-full p-1 hover:bg-gray-100">
                      <Minus className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold tabular-nums">{item.qty}</span>
                    <button type="button" onClick={() => changeQty(item.id, 1)} className="rounded-full p-1 hover:bg-gray-100">
                      <Plus className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <span className="w-10 text-right text-sm font-medium text-gray-700 tabular-nums">
                      {item.price * item.qty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-50 pt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">합계</span>
              <span className="text-lg font-bold text-emerald-500 tabular-nums">{total} 달란트</span>
            </div>
          </div>
        )}
      </div>

      {/* 하단 결제 버튼 */}
      <div className="sticky bottom-24 px-4 pb-2 max-w-lg mx-auto w-full">
        {posState === 'shopping' && (
          <Button
            onClick={handleScan}
            disabled={cart.length === 0}
            className="w-full rounded-full bg-emerald-500 py-3 text-base font-medium text-white hover:bg-emerald-600 disabled:opacity-40 shadow-lg shadow-emerald-200"
          >
            <QrCode className="mr-2 h-5 w-5" />
            유저 QR 스캔으로 결제
          </Button>
        )}

        {posState === 'scanning' && (
          <div className="flex items-center justify-center rounded-full bg-gray-100 py-3 text-sm text-gray-500">
            QR 스캔 중...
          </div>
        )}

        {posState === 'done' && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 rounded-full bg-emerald-50 py-3 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              결제 완료 — {total} 달란트 차감
            </div>
            <Button onClick={reset} variant="outline" className="w-full rounded-full">
              새 결제
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 시각 확인**

관리자 POS 페이지. 확인사항:
- 물품 그리드, 탭탭 선택 시 수량 뱃지
- 장바구니 + 수량 ±, 합산
- "QR 스캔으로 결제" → 2초 후 완료
- "새 결제" → 초기화

- [ ] **Step 3: 커밋**

```bash
git add src/app/markets/
git commit -m "feat: add admin market POS page"
```

---

## Task 15: 관리자 유저 목록 + 상세

**Files:**
- Create: `src/app/markets/[id]/(admin)/users/page.tsx`
- Create: `src/app/markets/[id]/(admin)/users/[userId]/page.tsx`

**Interfaces:**
- Consumes: `MOCK_PARTICIPANTS`, `MOCK_POINT_LOGS`, `MOCK_MISSIONS`
- Produces: 참여자 목록 + 개별 유저 상세 화면

- [ ] **Step 1: `src/app/markets/[id]/(admin)/users/page.tsx` 생성**

```tsx
import Link from 'next/link'
import { Search } from 'lucide-react'
import { MOCK_PARTICIPANTS } from '@/lib/mock-data'

export default async function AdminUsersPage(props: PageProps<'/markets/[id]/(admin)/users'>) {
  const { id } = await props.params
  const sorted = [...MOCK_PARTICIPANTS].sort((a, b) => b.balance - a.balance)

  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">유저 관리</h1>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="이름으로 검색"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-emerald-400"
        />
      </div>

      {/* 참여자 목록 */}
      <div className="space-y-2">
        {sorted.map((p) => {
          const missionsDone = 3
          return (
            <Link
              key={p.id}
              href={`/markets/${id}/users/${p.user.id}`}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                  {p.user.realName.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{p.user.realName}</p>
                    {p.role === 'admin' && (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-600">
                        관리자
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">미션 {missionsDone}개 완료</p>
                </div>
              </div>
              <span className="text-base font-bold tabular-nums text-emerald-500">{p.balance}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `src/app/markets/[id]/(admin)/users/[userId]/page.tsx` 생성**

```tsx
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PointLogItem } from '@/components/PointLogItem'
import { MOCK_PARTICIPANTS, MOCK_POINT_LOGS, MOCK_MISSIONS } from '@/lib/mock-data'

export default async function AdminUserDetailPage(
  props: PageProps<'/markets/[id]/(admin)/users/[userId]'>,
) {
  const { id, userId } = await props.params
  const participant = MOCK_PARTICIPANTS.find((p) => p.user.id === userId) ?? MOCK_PARTICIPANTS[0]
  const userLogs = MOCK_POINT_LOGS.filter((l) => l.userId === participant.user.id)
  const completedMissions = MOCK_MISSIONS.filter((m) =>
    m.slots?.some((s) => s.verifiedAt !== null),
  )

  return (
    <div className="min-h-svh bg-white">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-4">
        <Link href={`/markets/${id}/users`} className="text-gray-400">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{participant.user.realName}</h1>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-6">
        {/* 요약 카드 */}
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

        {/* 달란트 내역 */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">달란트 내역</h2>
          <div className="divide-y divide-gray-50 rounded-2xl border border-gray-100 bg-white px-4">
            {userLogs.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">내역이 없어요</p>
            ) : (
              userLogs.map((log) => <PointLogItem key={log.id} log={log} />)
            )}
          </div>
        </div>

        {/* 미션 현황 */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">미션 현황</h2>
          <div className="space-y-2">
            {MOCK_MISSIONS.map((m) => {
              const done = m.slots?.filter((s) => s.verifiedAt !== null).length ?? 0
              return (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
                  <span className="text-sm text-gray-700">{m.title}</span>
                  <span className="text-xs font-medium text-gray-400">
                    {done}/{m.limitCount}회
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 시각 확인**

- 관리자 유저 목록 — 검색, 잔액 순 정렬, 관리자 배지
- 유저 상세 — 잔액/미션완료 카드, 달란트 내역, 미션 현황

- [ ] **Step 4: 최종 빌드 확인**

```bash
pnpm build
```

오류 없이 완료.

- [ ] **Step 5: 최종 커밋**

```bash
git add src/app/markets/
git commit -m "feat: add admin users list and user detail pages"
```

---

## 자기 검토

### Spec 커버리지 확인

| 스펙 항목 | 구현 Task |
|---|---|
| 로그인 (카카오) | Task 2 |
| 온보딩 (본명/생일/성별) | Task 3 |
| 마켓 목록 (활성 마켓, QR 링크) | Task 4 |
| 마켓 참여 QR 랜딩 | Task 4 |
| FloatingTabBar (pill) | Task 5 |
| 유저 홈 (잔액 카드, 최근 내역) | Task 6 |
| 미션 목록 (구간 탭) | Task 7 |
| 미션 상세 (타입 A/B/C, 슬롯) | Task 8 |
| QR 모달 (5분 만료 안내) | Task 8 |
| 달란트 내역 타임라인 | Task 9 |
| 구매 내역 | Task 9 |
| 관리자 홈 (테이블, QR 버튼) | Task 10 |
| QR 스캔 + 단체 미션 흐름 | Task 11 |
| 달란트 수동 지급/차감 | Task 12 |
| 미션 CRUD | Task 13 |
| 마켓 POS | Task 14 |
| 유저 목록 + 상세 | Task 15 |
| 관리자 코드 입력 | ⚠️ 미구현 — 유저 홈 또는 설정에서 추가 필요 (Task 6에 포함 권장) |

### 타입 일관성

- `PageProps<'/markets/[id]/(user)/home'>` — Next.js 16 전역 헬퍼, 모든 page에서 동일하게 사용
- `await props.params` — 모든 dynamic page에서 필수
- `MOCK_CURRENT_USER` — `MarketParticipant` 타입, `.user.realName`, `.balance` 접근
- `MissionSlotData.verifiedAt` — `string | null`, null 체크 후 `new Date(slot.verifiedAt!)` 사용

### 미구현 항목 처리

관리자 코드 입력 기능은 Task 6 (`(user)/home/page.tsx`)의 `마이` 탭에 간단한 "관리자 코드 입력" 섹션으로 추가하거나, `/markets/[id]/(user)/purchases/page.tsx` 하단에 추가한다. 향후 Supabase 연동 시 구현할 항목이므로 뷰 단계에서는 폼 UI만 추가하면 충분하다.
