# 달란트페이 보안 감사 리포트

> 작성일: 2026-06-30 · 관점: 제3자 공격자 · 범위: `src/app/api/**`, `src/lib/**`

## 핵심 결론

서버는 **service-role 키로 Supabase에 접속해 RLS를 전부 우회**한다 (`src/lib/supabase.ts:8`, 주석에도 명시). 따라서 유일한 권한 통제는 라우트 래퍼다. 그런데 관리자 검증 래퍼 `marketAdminRoute`는 **정의만 되어 있고 어떤 라우트에서도 쓰이지 않는다** (`grep "marketAdminRoute" src/app/api` → 0건).

모든 "관리자" 동작이 일반 로그인 유저(`authRoute`) 또는 **아예 비로그인 누구에게나(`route`)** 열려 있다. **관리자 권한 모델 자체가 사실상 부재.**

### 라우트별 적용 래퍼 현황

| 라우트 | 메서드 | 래퍼 | 있어야 할 권한 |
|--------|--------|------|----------------|
| `participants/[userId]/points` | PATCH | `authRoute` | **admin** ❌ |
| `missions` | POST | `route` (무인증) | **admin** ❌ |
| `missions/[missionId]` | PATCH/DELETE | `route` (무인증) | **admin** ❌ |
| `missions/[missionId]/verify` | POST | `authRoute` | **admin** ❌ |
| `orders` | POST | `authRoute` | **admin** ❌ |
| `items` | POST | `route` (무인증) | **admin** ❌ |
| `items/[itemId]` | DELETE | `route` (무인증) | **admin** ❌ |
| `admin/auth` | POST | `authRoute` | (의도됨) ⚠️ |
| `transfer` | POST | `authRoute` | (의도됨) ✅ |
| `markets`, `markets/[id]` | GET | `route` | 공개 ⚠️ admin_code 유출 |
| `participants`, `participants/[userId]` | GET | `route` | 공개 ⚠️ PII 노출 |
| `point-logs` | GET | `route` | 공개 ⚠️ |

---

## 🔴 Critical — 즉시 악용 가능 (curl + 카카오 로그인 1개)

### 1. 자기 자신에게 무제한 포인트 지급
`participants/[userId]/points/route.ts:3` — `authRoute`만 사용.
```
PATCH /api/markets/{id}/participants/{본인userId}/points  {"amount": 999999}
```
관리자 검증 없음, 금액 상한/양수 검증 없음(음수로 타인 잔액 깎기도 가능).

### 2. 미션 CRUD가 인증 자체 없음
`missions/route.ts:16`, `missions/[missionId]/route.ts:15,40` — 전부 bare `route`.
**비로그인 상태로** 미션 생성(reward 임의)·수정·삭제 가능. 행사 전체 미션 삭제 또는 reward 9999짜리 미션 생성.

### 3. 미션 자가 인증으로 무한 적립
`verify/route.ts:23` — `authRoute`만. 자기 차단 로직이 `body.userId === verifiedBy && mission.type === 'user_qr'` 뿐.
→ **`admin_qr` / `upload` / `manual` 타입은 본인이 본인에게 인증 가능**. `limit_count = null`(무제한) 미션이면 slot 자동 증가로 무한 반복. 엔드포인트가 QR을 검증하지 않고 `body.userId`를 그대로 신뢰하므로 QR 스캔 흐름을 통째로 우회.

### 4. `admin_code` 평문 유출 → 누구나 관리자 승격
`GET /api/markets/{id}` (`markets/[marketId]/route.ts`)와 `GET /api/markets`가 `mapMarket`으로 **`admin_code`를 응답에 그대로 포함**(`db.ts:21`). 공개 엔드포인트. 코드를 읽어 `POST /admin/auth`에 넣으면 정식 경로로 관리자 승격. (설령 막혀도 #1~3으로 관리자가 불필요.)

### 5. 타인 잔액 임의 차감 + 가격 위조 (POS 위조)
`orders/route.ts:19` — `authRoute`만. `body.userId`에 임의 참가자 → 피해자 잔액 차감(그리핑). 게다가 **가격을 클라이언트가 보낸 `body.items[].price`로 계산**(`market_items` 테이블과 대조 안 함) → 가격 위조.

### 6. 아이템 CRUD 인증 없음
`items/route.ts:13`, `items/[itemId]/route.ts` — bare `route`. 비로그인 아이템 생성·삭제.

---

## 🟠 High — 정보 노출 / 흐름 허점

### 7. PII·잔액 전량 공개
`participants/route.ts` GET, `participants/[userId]/route.ts` GET 모두 bare `route`. 비로그인으로 전 참가자 `real_name`·잔액·전체 `point_logs`·구매내역 조회 가능.

### 8. QR 서명/만료 부재 — 문서와 불일치
CLAUDE.md는 "미션 QR = HMAC-SHA256 서명, 유효 5분, 재사용 차단"이라 명시하지만 실제 `qr.ts`엔 **서명도 만료도 없다**. `dalant:m:marketId:missionId:userId` 평문 → 위조 자유. (단 #3 때문에 QR 위조조차 불필요.) Pay QR(`dalant:p:...`)은 단순 식별자라 설계상 OK.

### 9. `admin/auth` 무차단 브루트포스
`admin/auth/route.ts:12` — 평문 비교, rate limit 없음. (#4로 코드가 이미 새므로 부차적.)

---

## 🟡 Medium

- **transfer**: 양수 정수·자기전송 차단 OK(`transfer/route.ts:9-10`), RPC 원자적 처리. 다만 마켓 활성 기간(`starts_at`/`ends_at`) 검증 없음 — 종료된 행사에서도 동작.
- **입력 검증 전반 부재**: reward·amount·price 음수/과대값, 미션 `type` enum 미검증.

---

## 권장 수정 (우선순위)

1. **`marketAdminRoute`를 실제로 적용** — missions(POST/PATCH/DELETE), items(POST/DELETE), orders(POST), points(PATCH), verify(POST), admin/auth를 admin 게이트로 교체. 가장 큰 ROI, Critical 대부분 일괄 차단.
2. **`mapMarket`에서 `admin_code` 제거** — 공개 GET 응답에 절대 포함 금지. 승격 검증은 서버 내부에서만.
3. **verify 자가 인증 차단을 모든 타입으로 확장** + 실제 QR 서명/만료 검증 도입(문서대로).
4. **orders 가격을 서버의 `market_items`에서 조회**, 클라이언트 price 무시.
5. **participants / point-logs GET에 최소 인증**(본인 마켓 소속) 적용.
