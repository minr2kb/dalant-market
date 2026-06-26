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

## 미션 타입 (`MissionType`)

| 값 | 한국어 | 인증 방식 |
|----|--------|-----------|
| `'user_qr'` | 유저 간 인증 | 미션 수행자가 QR 생성 → 다른 참여자가 스캔 |
| `'upload'` | 업로드형 | 사진 업로드 → 관리자가 승인 후 QR 스캔 |
| `'admin_qr'` | 관리자 인증 | 미션 수행자가 QR 생성 → 관리자가 직접 스캔 |
| `'manual'` | 상시 | 인증 없음 — 관리자가 수동 지급 (게임 포인트 등) |

- `limitCount: number | null` — `null` = 무제한
- `isGroup: boolean` — 단체 미션이면 관리자 QR 스캔 시 같이 줄 인원 선택 창 표시
- `activeFrom` / `activeUntil` — `null`이면 제한 없음

## 미션 상태 (`MissionStatus`)

`getMissionStatus(mission)` — `src/types/index.ts` 에 정의
- `'active'`: `activeFrom ≤ now ≤ activeUntil`
- `'upcoming'`: `activeFrom > now` (UI에 탭 노출 안 함)
- `'past'`: `activeUntil < now`

## 모달 규칙

**모든 모달은 뒤로가기로 닫혀야 한다.**

`useModalHistory(open, close)` 훅(`src/hooks/use-modal-history.ts`)을 반드시 사용한다.

```tsx
const [open, setOpen] = useState(false)
const close = useCallback(() => setOpen(false), [])
useModalHistory(open, close)      // 열릴 때 pushState, popstate로 close 연결
```

- X 버튼 / 배경 클릭 닫기: `setOpen(false)` ❌ → `window.history.back()` ✅
- 모달 내부에서 직접 `setOpen(false)`를 호출하면 history 스택이 남아 다음 뒤로가기가 어긋남
- 새 모달을 만들 때도 동일하게 적용할 것

## 버튼·입력 높이 규칙

**모든 인터랙티브 요소는 shadcn/ui 기반으로 작성한다.**

| 요소 | 최소 높이 | 비고 |
|------|-----------|------|
| 주요 액션 `Button` (CTA, 확인, 제출) | `h-12` (48px) | `py-*` 단독 사용 금지 |
| 보조 `Button` (취소, 보조 액션) | `h-10` (40px) | |
| `Input` (텍스트, 숫자, 검색) | `h-12` (48px) | `py-*`로 높이 지정 금지 |
| 탭 pill (토글형 선택) | `h-9` (36px) | 네이티브 `<button>` 허용 |
| 카드형 선택지 (성별, 옵션 카드 등) | 자유 (`py-6` 등) | 카드 전체가 터치 영역 |
| 아이콘 전용 버튼 (삭제, 추가 아이콘) | `h-8`~`h-10` | 네이티브 `<button>` 허용 |

**금지 패턴**
- `<input>` 네이티브 태그 직접 사용 → `<Input>` (shadcn)으로 교체
- `Button`에 `py-*`만으로 높이 지정 → 반드시 `h-*` 병행
- `size="sm"` → 높이가 36px 이하로 떨어지므로 사용 금지 (탭 pill 제외)

## 스타일링

- Tailwind CSS v4 — `tailwind.config.js` 없음, `@import "tailwindcss"` in CSS
- shadcn/ui 컴포넌트는 `src/components/ui/` 에 복사되어 있음
- pnpm 워크스페이스: `ignore-workspace-root-check = true` 설정됨
