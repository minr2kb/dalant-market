# Dalant Market — Frontend Views 디자인 스펙

> 작성일: 2026-06-25

---

## 1. 서비스 개요

오프라인 모임(수련회, MT 등)에서 미션 인증 기반으로 달란트(포인트)를 적립하고 마켓에서 사용하는 웹 서비스. 스마트폰 기준 모바일-퍼스트, 기본 데스크탑 대응.

---

## 2. 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) |
| 스타일링 | Tailwind CSS v4 + shadcn/ui |
| 패키지 매니저 | pnpm |
| 린터 | Biome |
| 상태(뷰 단계) | 정적 mock 데이터 (추후 Supabase 연결) |

---

## 3. 비주얼 시스템

### 컬러

| 역할 | 값 |
|---|---|
| Background | `white` / `gray-50` |
| Primary (적립·강조) | `emerald-500` (#10B981) |
| Text | `gray-900` / `gray-500` |
| Danger (차감) | `rose-500` |
| 카드 테두리 | `gray-100` |

### 타이포그래피

- 한글: Noto Sans KR (next/font/google)
- 잔액 숫자: `tabular-nums font-bold text-3xl`

### 공통 컴포넌트 규칙

- 카드: `rounded-2xl shadow-sm border border-gray-100`
- 버튼(primary): `rounded-full bg-emerald-500 text-white`
- 입력: shadcn/ui `<Input>`, `<Select>` 기본 스타일

---

## 4. 네비게이션

### Floating Bottom Tab Bar

- 위치: `fixed bottom-4 left-4 right-4`
- 형태: `rounded-full bg-white shadow-2xl` — 화면 위에 떠있는 pill 형태
- 활성 탭: emerald 아이콘 + 텍스트 표시
- 비활성 탭: gray 아이콘만

**유저 탭 (4개)**
```
홈 | 미션 | 내역 | 마이
```

**관리자 탭 (5개)**
```
홈 | 스캔 | 달란트 | 미션 | 유저
```

---

## 5. 라우팅 구조

```
/login                                      ← 카카오 로그인
/onboarding                                 ← 최초 가입 시 본명·생일·성별 입력
/markets                                    ← 활성 마켓 목록
/markets/[id]                               ← QR 링크 통한 마켓 참여

/markets/[id]/(user)/home
/markets/[id]/(user)/missions
/markets/[id]/(user)/missions/[missionId]
/markets/[id]/(user)/history
/markets/[id]/(user)/purchases

/markets/[id]/(admin)/home
/markets/[id]/(admin)/scan
/markets/[id]/(admin)/points
/markets/[id]/(admin)/missions
/markets/[id]/(admin)/pos
/markets/[id]/(admin)/users
/markets/[id]/(admin)/users/[userId]
```

`(user)` / `(admin)` 은 Next.js route group — URL에 노출되지 않음.  
각 route group은 자체 `layout.tsx`를 가지며 floating tab bar를 포함한다.

---

## 6. 인증 플로우

```
카카오 로그인
  → 신규 유저: /onboarding (본명·생일·성별 입력) → /markets
  → 기존 유저: /markets

마켓 참여 방법 ①: QR 스캔 → /markets/[id] → 참여 → (user)/home
마켓 참여 방법 ②: /markets 에서 활성 마켓 목록 확인 후 직접 참여

관리자 승격: (user)/home 또는 설정에서 "관리자 코드 입력"
  → 마켓 생성자가 발급한 코드 입력 → 즉시 admin 권한 부여
```

---

## 7. 화면별 상세 스펙

### 7.1 `/login` — 카카오 로그인

- 중앙 정렬 레이아웃
- 서비스 로고 / 타이틀 ("Dalant Market")
- 카카오 로그인 버튼 1개 (카카오 공식 색상 `#FEE500`)
- 하단 서비스 설명 한 줄

---

### 7.2 `/onboarding` — 최초 가입 프로필

- 진행 단계 표시 (1/3 → 2/3 → 3/3)
- Step 1: 본명 입력 (text input)
- Step 2: 생일 입력 (date picker 또는 YYYY-MM-DD 입력)
- Step 3: 성별 선택 (남 / 여 toggle button)
- 완료 시 /markets 이동

---

### 7.3 `/markets` — 마켓 목록

- 상단: "참여 가능한 마켓" 헤더
- 활성 마켓 카드 리스트: 행사명, 기간, 참여인원 수
- 이미 참여 중인 마켓은 "입장하기" 버튼, 미참여는 "참여하기" 버튼
- 빈 상태: "아직 참여 중인 마켓이 없어요" + QR 스캔 안내

---

### 7.4 `/markets/[id]` — 마켓 참여 (QR 링크 랜딩)

- 마켓 이름·설명·기간 표시
- "참여하기" CTA 버튼
- 로그인 안 된 상태면 카카오 로그인 먼저

---

### 7.5 `(user)/home` — 유저 홈

- 상단: 마켓 이름 + 유저 이름
- 잔액 카드: 달란트 잔액 큰 숫자 (emerald), 포인트 단위 라벨
- 최근 내역 3건 (미션명 또는 구매명, 금액, 시각)
- "전체 내역 보기" 링크
- floating tab bar

---

### 7.6 `(user)/missions` — 미션 목록

- 구간 탭: `2주 전 | 1주 전 | 수련회`
- 각 탭 내 미션 카드 리스트
- 미션 카드: 제목, 달란트 금액, 상태 뱃지 (미완료 / 대기중 / 완료)
- 카드 탭 → 미션 상세로 이동

---

### 7.7 `(user)/missions/[missionId]` — 미션 상세

**공통 상단**
- 미션 제목, 달란트 금액, 타입 설명

**타입 A (QR + 업로드)**
- 사진 업로드 버튼
- 업로드 완료 후 QR 생성 버튼 활성화
- QR 코드 표시 모달

**타입 B (QR 즉시)**
- QR 생성 버튼 (진입 즉시 활성)
- QR 코드 표시 모달

**타입 C (관리자 일괄)**
- "관리자가 일괄 지급합니다" 안내 텍스트
- 인증 완료 시 결과만 표시

**슬롯 목록** (limit_count 수만큼)
- 완료 슬롯: 인증자 이름 + 시각
- 대기 슬롯: "QR 대기중" 표시

---

### 7.8 `(user)/history` — 달란트 내역

- 적립/차감/구매 타임라인
- 적립: emerald `+N달란트`, 미션명, 인증자
- 차감/구매: rose `-N달란트`, 물품명 또는 사유
- 날짜 구분선

---

### 7.9 `(user)/purchases` — 구매 내역

- 구매 이력 카드 리스트
- 카드: 구매 일시, 물품 목록, 합계 달란트

---

### 7.10 `(admin)/home` — 관리자 홈

- 상단: 마켓 이름 + "관리자" 뱃지
- 전체 인원 달란트 현황 테이블 (이름, 잔액, 미션 완료 수)
- 하단 큰 "QR 스캔" 버튼 (emerald, full-width)
- floating tab bar (관리자용)

---

### 7.11 `(admin)/scan` — QR 스캔 처리

- 카메라 뷰파인더 (전체 화면에 가깝게)
- 스캔 성공 시 하단 시트 슬라이드업:
  - 유저명 + 미션명 확인
  - 단체 미션이면 참여자 추가 선택 UI
  - "확인" 버튼으로 즉시 처리

---

### 7.12 `(admin)/points` — 달란트 수동 관리

- 유저 선택 드롭다운
- 지급 / 차감 토글
- 금액 직접 입력
- 사유 메모 입력
- 제출 버튼

---

### 7.13 `(admin)/missions` — 미션 관리

- 미션 목록 + "미션 추가" 버튼
- 미션 카드: 제목, 타입, 달란트, 활성화 여부 토글
- 탭 → 미션 수정 시트 (타입·달란트·limit·기간 설정)

---

### 7.14 `(admin)/pos` — 마켓 POS

- 물품 그리드 (탭탭 선택, 수량 +/- 조절)
- 하단 고정 바: 선택 물품 목록 + 합산 달란트
- "QR 스캔으로 결제" 버튼 → 카메라 오픈 → 유저 QR 스캔 → 즉시 차감

---

### 7.15 `(admin)/users` — 유저 관리 목록

- 전체 참여자 테이블: 이름, 잔액, 미션 완료 수
- 이름 탭 → 유저 상세로 이동
- 상단 검색 입력

---

### 7.16 `(admin)/users/[userId]` — 유저 상세

- 유저 이름, 잔액, 가입일
- 해당 유저의 미션 인증 내역
- 달란트 변동 내역

---

## 8. Mock 데이터 전략

- 각 페이지 컴포넌트 내부에 `const mockData = { ... }` 인라인 정의
- 추후 Supabase 연결 시 동일 인터페이스를 유지하면서 교체
- TypeScript 타입을 `src/types/` 에 미리 정의

---

## 9. 폴더 구조

```
src/
  app/
    login/page.tsx
    onboarding/page.tsx
    markets/
      page.tsx
      [id]/
        page.tsx
        (user)/
          layout.tsx          ← floating tab bar (유저)
          home/page.tsx
          missions/page.tsx
          missions/[missionId]/page.tsx
          history/page.tsx
          purchases/page.tsx
        (admin)/
          layout.tsx          ← floating tab bar (관리자)
          home/page.tsx
          scan/page.tsx
          points/page.tsx
          missions/page.tsx
          pos/page.tsx
          users/
            page.tsx
            [userId]/page.tsx
  components/
    ui/                       ← shadcn/ui 컴포넌트
    FloatingTabBar.tsx
    MissionCard.tsx
    MissionSlot.tsx
    PointLogItem.tsx
    QRModal.tsx
    MarketCard.tsx
  types/
    index.ts                  ← Market, Mission, User, PointLog, Order 타입
  lib/
    mock-data.ts              ← 공용 mock 데이터
```
