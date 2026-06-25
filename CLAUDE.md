@AGENTS.md

# Dalant Market — 개발 컨텍스트

## 라우팅 구조

```
/login                              → 카카오 로그인
/onboarding                         → 최초 1회 본명/생일/성별 입력
/markets                            → 마켓 목록
/markets/[id]                       → QR 랜딩 (마켓 진입)
/markets/[id]/(user)/...            → 일반 유저 화면 (route group, URL에 포함 안됨)
/markets/[id]/home                  → 유저 홈
/markets/[id]/missions              → 미션 목록 (status=active|past)
/markets/[id]/missions/[missionId]  → 미션 상세
/markets/[id]/history               → 달란트 내역 (구매내역 포함, 탭 확장)
/markets/[id]/admin/...             → 관리자 화면 (/admin/ URL 세그먼트 포함)
/markets/[id]/admin/home
/markets/[id]/admin/scan
/markets/[id]/admin/points
/markets/[id]/admin/missions
/markets/[id]/admin/pos
/markets/[id]/admin/users
/markets/[id]/admin/users/[userId]
```

## Next.js 16 주의사항

- `params`는 `Promise`다 — 반드시 `await props.params`
- `PageProps<'/path'>` / `LayoutProps<'/path'>` 타입은 전역 사용 가능 (import 불필요)
- **경로 문자열에 route group 이름 포함 금지**: `PageProps<'/markets/[id]/(user)/home'>` → ❌ / `PageProps<'/markets/[id]/home'>` → ✅
- Server Component → Client Component props: 직렬화 불가 값(React 컴포넌트, 함수) 전달 불가

## UI 패턴

- **아이콘 전달**: `FloatingTabBar`에 Lucide 컴포넌트 직접 전달 불가 → 문자열 키(`'Home'`, `'ListTodo'` 등)로 전달, 내부 `ICON_MAP`에서 해석
- **모달**: `'use client'` 컴포넌트로 분리 후 Server Component에서 import
- 탭바: 고정 pill 형태 `fixed bottom-4 left-4 right-4 rounded-full`
- 기본 색상: emerald `oklch(0.696 0.17 162.48)` (`--color-primary` 재정의)

## 미션 상태

`getMissionStatus(mission)` — `src/types/index.ts` 에 정의
- `'active'`: `activeFrom ≤ now ≤ activeUntil`
- `'upcoming'`: `activeFrom > now` (UI에 탭 노출 안 함)
- `'past'`: `activeUntil < now`

## 스타일링

- Tailwind CSS v4 — `tailwind.config.js` 없음, `@import "tailwindcss"` in CSS
- shadcn/ui 컴포넌트는 `src/components/ui/` 에 복사되어 있음
- pnpm 워크스페이스: `ignore-workspace-root-check = true` 설정됨
