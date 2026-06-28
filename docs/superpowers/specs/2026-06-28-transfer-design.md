# 유저간 달란트 전송 기능 설계

**날짜**: 2026-06-28  
**상태**: 확정

---

## 개요

마켓 참가자끼리 달란트(포인트)를 직접 전송하는 기능. 보내는 사람이 주도하며, 상대방은 QR 스캔 또는 이름 검색으로 특정한다.

---

## DB / 타입 변경

### `point_logs.reason_type` enum 확장

기존: `'mission' | 'purchase' | 'manual'`  
변경: `'mission' | 'purchase' | 'manual' | 'transfer'`

Supabase migration 필요:
```sql
ALTER TYPE reason_type ADD VALUE 'transfer';
```

### `memo` 컬럼 활용

전송 내역의 `memo`는 `"<송신자 이름> -> <수신자 이름>"` 포맷으로 기입.  
예: `"홍길동 -> 김철수"`

새 DB 컬럼 추가 없이 기존 `memo` 필드 재활용.

---

## API

### 새 엔드포인트

`POST /markets/:marketId/transfer`

**요청 body**:
```ts
{ toUserId: string; amount: number }
```

**인증**: 세션 쿠키에서 `fromUserId` 추출 (기존 auth 패턴 동일).

**서버 처리 (원자적)**:

Supabase RPC(DB function)로 단일 트랜잭션 처리 — Route Handler에서 직접 여러 쿼리를 순서대로 실행하면 중간 실패 시 잔액 불일치 위험이 있으므로, `transfer_points(from_id, to_id, market_id, amount)` Postgres function을 작성해 호출.

1. `amount < 1` 또는 `toUserId === fromUserId` 시 400 에러
2. 송신자 잔액 조회 → 부족 시 400 에러 (`"잔액이 부족합니다"`)
3. 송신자 잔액 차감 (`balance -= amount`)
4. 수신자 잔액 증가 (`balance += amount`)
5. `point_logs` 2건 삽입:
   - 송신자: `amount = -amount`, `reason_type = 'transfer'`, `memo = "홍길동 -> 김철수"`
   - 수신자: `amount = +amount`, `reason_type = 'transfer'`, `memo = "홍길동 -> 김철수"`

**응답**:
```ts
{ data: { fromUserId: string; toUserId: string; amount: number; newBalance: number } }
```

### router.ts 추가

```ts
transfer: endpoint({
  method: 'POST',
  path: '/:marketId/transfer',
  request: {
    path: marketId,
    body: z.object({ toUserId: z.string(), amount: z.number().int().min(1) }),
  },
  response: oneOf(z.object({
    fromUserId: z.string(),
    toUserId: z.string(),
    amount: z.number(),
    newBalance: z.number(),
  })),
})
```

---

## QR 처리

기존 Pay QR(`dalant:p:marketId:userId`)을 **신분증**으로 재활용.  
전송 모달의 QR 스캔 탭에서 `dalant:p:...` 타입을 인식해 수신자 userId를 추출.  
새 QR 타입 추가 없음. 수신자 전용 버튼도 없음.

---

## UI

### 홈 화면 (`UserHomeClient.tsx`)

기존 emerald 카드 안 PayQRButton 옆에 "전송하기" 아이콘 버튼 추가.  
`<TransferButton>` 컴포넌트로 분리 (`'use client'`).

```
[ 보유 달란트 ]
[ 잔액 숫자  ] [ QR아이콘 ] [ 전송아이콘 ]
```

### `TransferModal` 컴포넌트

`src/components/TransferModal.tsx` — `'use client'`

**단계 흐름**:
```
[1단계] 상대 선택
  ├── 탭: QR 스캔
  │     └── QRScanner 재사용 → dalant:p:... 인식 → 참가자 조회 → 2단계
  └── 탭: 이름 검색
        └── 참가자 목록 실시간 필터 (자신 제외) → 탭 → 2단계

[2단계] 금액 입력
  └── Input (숫자) + "전송하기" 버튼 → 3단계

[3단계] 확인 다이얼로그
  └── "○○에게 N달란트를 전송할까요?" + 취소 / 전송 버튼
        └── 전송 API 호출 → 성공 시 모달 닫기 + 쿼리 invalidate
```

모달 뒤로가기 지원: `useModalHistory(open, close)` 적용.  
X 버튼 / 배경 클릭: `window.history.back()`.

### `PointLogItem.tsx` 변경

`'transfer'` reasonType 처리:
- 아이콘: 수신(`+`) → `ArrowDownLeft` (emerald), 송신(`-`) → `ArrowUpRight` (blue)
- 라벨: `memo` 값 그대로 표시 (예: "홍길동 -> 김철수")
- 부제목: 수신이면 `"달란트 받음"`, 송신이면 `"달란트 전송"`

---

## 파일 목록 (신규/변경)

| 파일 | 변경 |
|------|------|
| `src/types/index.ts` | `PointReasonType`에 `'transfer'` 추가 |
| `src/lib/api/schemas.ts` | `PointLogSchema` reasonType enum 확장, `transferRouter` 추가 |
| `src/lib/api/router.ts` | `transferRouter` 엔드포인트 추가 |
| `src/app/api/markets/[marketId]/transfer/route.ts` | 신규 Route Handler |
| `src/components/TransferModal.tsx` | 신규 — 전송 모달 전체 |
| `src/components/TransferButton.tsx` | 신규 — 홈 카드용 버튼 |
| `src/app/markets/[id]/(user)/home/UserHomeClient.tsx` | TransferButton 추가 |
| `src/components/PointLogItem.tsx` | transfer 타입 아이콘/라벨 처리 |
| Supabase migration | `reason_type` enum에 `'transfer'` 추가 |
