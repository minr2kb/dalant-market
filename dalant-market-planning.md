# Dalant Market 기획서

> 오프라인 모임을 위한 미션 인증 기반 포인트 마켓 서비스

---

## 1. 서비스 개요

**Dalant Market**은 오프라인 모임(수련회, MT, 행사 등)에서 미션을 수행하고 달란트(포인트)를 적립한 뒤, 마켓에서 사용하는 전 과정을 웹으로 처리하는 서비스다.

실물 달란트나 명찰 뒷면 미션표 없이, 스마트폰 하나로 미션 인증부터 마켓 결제까지 처리한다. 관리자가 화면 앞에 앉아서 승인 리스트를 처리하는 방식이 아니라, 현장에서 QR을 통해 즉시 처리하는 동적 운영 방식이다.

- 운영 인원: 약 25명
- 관리자: 전도사님 + 임원 4명 (관리자도 참여자로 동일하게 미션 수행 가능)
- 일정: 수련회 2주 전 ~ 수련회 기간 (2박 3일)
- 확장성: 마켓 단위로 격리되어, 다음 행사에도 그대로 재사용 가능

---

## 2. 핵심 개념

### 마켓 (Market)

행사 단위의 이벤트 컨텍스트다. 모든 미션, 참여자, 달란트 내역, 구매 기록은 마켓에 속한다. 행사가 끝나도 데이터가 남아있고, 다음 행사는 새 마켓을 만들어서 독립적으로 운영한다.

### 달란트

마켓 내에서 통용되는 포인트다. 미션 인증 시 적립되고, 마켓 구매 시 차감된다. 관리자가 수동으로 지급 및 차감할 수도 있다. 마켓마다 단위 이름을 커스텀할 수 있다 (달란트, 코인, 별 등).

### QR 인증

모든 인증의 핵심 수단이다. 인증이 필요한 유저가 QR을 띄우고, 상대방(관리자 또는 유저)이 카메라로 스캔하면 즉시 처리된다. QR에는 `미션 ID + 유저 ID + 타임스탬프`가 서명되어 포함되며, 유효시간은 5분이다. 이미 처리된 QR을 다시 스캔하거나 캡처해서 재사용하는 것은 서버에서 차단한다.

---

## 3. 권한 구조

권한은 마켓 단위로 부여된다. 같은 사람이 이번 수련회엔 일반 참여자, 다음 수련회엔 관리자가 될 수 있다.

| 권한 | 설명 |
|---|---|
| `admin` | 전도사님, 임원. 미션 관리, QR 스캔 처리, 달란트 수동 지급/차감, 마켓 POS 사용 가능 |
| `user` | 일반 참여자. 미션 인증 제출, 달란트 내역 확인, 마켓 구매 가능 |

관리자도 참여자로서 동일하게 미션 인증을 받을 수 있다. 단, 자기 자신의 QR을 자기가 스캔하는 것은 서버에서 차단한다 (`verified_by != user_id`).

---

## 4. 미션 인증 타입

미션마다 인증 타입이 지정된다. 타입에 따라 유저 화면의 인증 UI가 다르게 렌더링된다.

### 타입 A — QR + 업로드

사진을 남기고 싶은 미션에 적용한다.

```text
유저가 사진 업로드
  → 업로드 완료 시 QR 버튼 활성화
  → 관리자에게 QR 제시
  → 관리자가 카메라로 스캔
  → 즉시 달란트 적립
  → QR 슬롯 자리에 인증자 이름 + 시간 표시
```

| 해당 미션 |
|---|
| 설교노트 제출 |
| 팀원 전체 포즈샷 |
| 말씀 암송 (구술 확인 후 관리자 스캔) |

### 타입 B — QR 즉시 인증

사진 없이 만남의 순간에 바로 처리하는 미션에 적용한다. 관리자뿐 아니라 일반 유저도 스캔할 수 있다.

```text
유저가 미션 선택 후 QR 생성
  → 상대방(관리자 또는 유저)이 카메라로 스캔
  → 즉시 달란트 적립
  → QR 슬롯 자리에 인증자 이름 + 시간 표시
```

| 해당 미션 |
|---|
| 칭찬 2마디 (상대방 스캔) |
| 기도제목 나누기 (상대방 스캔) |
| 생일월 투샷 (임원 스캔) |
| 임원과 투샷 (임원 스캔) |
| 하이파이브 / 허깅 (전도사님 or 임원 스캔) |
| 신앙 질문하기 (전도사님 스캔) |

### 타입 C — 관리자 일괄 지급

개인 인증 없이 관리자가 직접 대상자를 선택해서 지급한다.

```text
관리자가 미션 선택
  → 대상자 목록에서 해당 인원 선택
  → 일괄 달란트 지급
```

| 해당 미션 |
|---|
| 레크레이션 (1일차, 2일차) |
| 히든 미션 (담임목사님 인사 후 직접 수령 → 관리자 대리 지급) |
| QT 인증, 예배 참석 (관리자 확인 후 일괄 처리) |

---

## 5. 단체 미션 처리

단체 미션은 타입 A 또는 B 모두 적용 가능하다. 미션 설정 시 `is_group` 플래그를 켜두면, 스캔 후 참여자 추가 선택 화면이 뜬다.

```text
대표 1명 QR 제시
  → 관리자(또는 상대방)가 스캔
  → "단체 미션입니다. 참여자를 추가하세요" 화면 진입
  → 로그인된 참여자 목록에서 추가 선택
  → 확인 탭 → 선택된 전원 일괄 달란트 적립
```

---

## 6. 미션 설정 항목

관리자가 미션을 만들 때 설정하는 항목 목록이다.

| 항목 | 설명 |
|---|---|
| `title` | 미션 이름 |
| `type` | 인증 타입 (A / B / C) |
| `is_group` | 단체 미션 여부 |
| `reward` | 달란트 지급량 |
| `limit_count` | 최대 인증 횟수 (1이면 1회성, 3이면 최대 3회) |
| `active_from` | 미션 활성화 시작 시각 |
| `active_until` | 미션 활성화 종료 시각 |
| `is_active` | 날짜 범위 안에서도 긴급 비활성화 가능 |

---

## 7. 미션 카드 UI — 다회 미션 슬롯 구조

limit이 3인 미션의 예시다. 인증 완료된 슬롯에는 QR 버튼 대신 인증자 이름과 시각이 표시된다.

```text
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   1회차      │ │   2회차      │ │   3회차      │
│ 박전도사 확인 │ │ 김임원 확인  │ │  [QR 대기중] │
│   14:32     │ │   16:05     │ │             │
└─────────────┘ └─────────────┘ └─────────────┘
```

타입 A는 사진을 업로드해야 QR 버튼이 활성화된다. 타입 B는 미션 진입 즉시 QR 버튼이 활성화된다.

---

## 8. 마켓 POS 흐름

관리자가 마켓 운영 시간에 POS처럼 물품을 입력하고, 유저 QR을 스캔해서 달란트를 차감하는 방식이다. 재고 관리는 없다.

```text
관리자가 마켓 POS 화면 진입
  → 물품 목록에서 탭탭 선택 (수량 조절 포함)
  → 합산 금액 확인
  → 유저 QR 스캔
  → 달란트 차감 + 구매 내역 저장
```

유저 입장에서는 홈 화면의 QR 버튼을 눌러서 제시하기만 하면 된다.

---

## 9. 화면 목록

### 공통

| 화면 | 설명 |
|---|---|
| 로그인 | 이름 선택 + 개인 코드 4자리 입력. 가입 없이 관리자가 사전 세팅. |

### 일반 유저

| 화면 | 주요 기능 |
|---|---|
| 홈 | 달란트 잔액, 최근 내역 3건, QR 스캔 버튼 (상대방 인증 요청 처리용) |
| 미션 목록 | 구간 탭 (2주 전 / 1주 전 / 수련회), 미완료 / 대기중 / 완료 상태 표시 |
| 미션 상세 | 인증 타입별 UI 렌더링, 슬롯별 인증자 이름 표시 |
| 달란트 내역 | 적립 / 차감 / 구매 타임라인. 미션명, 인증자, 물품명 포함 |
| 마켓 구매 내역 | 구매 이력 확인 |

### 관리자

| 화면 | 주요 기능 |
|---|---|
| 관리자 홈 | 전체 인원 달란트 현황 테이블, QR 스캔 버튼 크게 배치 |
| QR 스캔 처리 | 스캔 후 유저명 + 미션명 확인, 단체 미션이면 참여자 추가 선택, 확인 탭으로 즉시 처리 |
| 달란트 수동 관리 | 유저 선택 → 지급 / 차감 / 미션 선택 승인 / 미션 인증 취소 (달란트 환수). 숫자 직접 입력 + 사유 메모 |
| 미션 관리 | 미션 추가 / 수정 / 비활성화, 타입 / 달란트 / limit / 활성화 기간 설정 |
| 마켓 POS | 물품 탭탭 선택, 합산 확인, 유저 QR 스캔으로 결제 처리 |
| 유저 관리 | 전체 참여자 달란트 잔액 + 미션 현황 테이블, 개별 유저 상세 내역 |

---

## 10. DB 스키마

### `users` — 서비스 전체 유저

```sql
users (
  id          uuid PRIMARY KEY,
  name        text NOT NULL,
  code        text NOT NULL,        -- 로그인용 4자리 코드
  created_at  timestamp
)
```

### `markets` — 행사 단위 컨텍스트

```sql
markets (
  id            uuid PRIMARY KEY,
  title         text NOT NULL,        -- ex. "2025 바울공동체 수련회"
  description   text,
  point_label   text NOT NULL DEFAULT '달란트',  -- 포인트 단위 이름 커스텀
  starts_at     timestamp,
  ends_at       timestamp,
  created_at    timestamp
)
```

### `market_participants` — 마켓별 참여자 및 권한

```sql
market_participants (
  id         uuid PRIMARY KEY,
  market_id  uuid REFERENCES markets(id),
  user_id    uuid REFERENCES users(id),
  role       text NOT NULL,         -- 'admin' | 'user'
  balance    int  NOT NULL DEFAULT 0,
  UNIQUE (market_id, user_id)
)
```

### `missions` — 미션 목록

```sql
missions (
  id           uuid PRIMARY KEY,
  market_id    uuid REFERENCES markets(id),
  title        text NOT NULL,
  type         text NOT NULL,       -- 'upload' | 'qr' | 'admin_grant'
  is_group     boolean DEFAULT false,
  reward       int  NOT NULL,
  limit_count  int  NOT NULL DEFAULT 1,
  active_from  timestamp,
  active_until timestamp,
  is_active    boolean DEFAULT true,
  created_at   timestamp
)
```

### `mission_logs` — 미션 인증 기록

```sql
mission_logs (
  id           uuid PRIMARY KEY,
  mission_id   uuid REFERENCES missions(id),
  user_id      uuid REFERENCES users(id),  -- 인증 받은 유저
  verified_by  uuid REFERENCES users(id),  -- 인증 해준 유저 (자기 자신 불가)
  slot         int  NOT NULL DEFAULT 1,    -- 다회 미션의 회차
  photo_url    text,                       -- 타입 A만 사용
  verified_at  timestamp,
  UNIQUE (mission_id, user_id, slot),
  CHECK (user_id != verified_by)
)
```

### `point_logs` — 포인트 변동 원장

```sql
point_logs (
  id           uuid PRIMARY KEY,
  market_id    uuid REFERENCES markets(id),
  user_id      uuid REFERENCES users(id),
  amount       int  NOT NULL,              -- 양수: 적립, 음수: 차감
  reason_type  text NOT NULL,             -- 'mission' | 'purchase' | 'manual'  (point 변동 출처)
  ref_id       uuid,                       -- mission_logs.id 또는 orders.id
  memo         text,                       -- 수동 처리 시 사유
  created_at   timestamp
)
```

### `orders` — 마켓 구매 내역

```sql
orders (
  id           uuid PRIMARY KEY,
  market_id    uuid REFERENCES markets(id),
  user_id      uuid REFERENCES users(id),      -- 구매한 유저
  verified_by  uuid REFERENCES users(id),      -- 결제 처리한 관리자
  items        jsonb NOT NULL,                 -- [{name, price, qty}]
  total        int  NOT NULL,
  purchased_at timestamp
)
```

---

## 11. QR 데이터 구조

QR에는 다음 정보가 포함된다. HMAC 서명으로 위변조를 방지하고, 유효시간은 5분이다.

### 미션 인증 QR

```json
{
  "type": "mission",
  "mission_id": "uuid",
  "user_id": "uuid",
  "market_id": "uuid",
  "expires_at": "2025-08-01T14:37:00Z",
  "signature": "hmac_sha256_hash"
}
```

### 마켓 결제 QR

```json
{
  "type": "payment",
  "user_id": "uuid",
  "market_id": "uuid",
  "expires_at": "2025-08-01T14:37:00Z",
  "signature": "hmac_sha256_hash"
}
```

스캔 후 `type` 필드로 분기 처리한다. 결제 QR은 관리자가 물품 선택을 완료한 상태에서 스캔하면 즉시 차감된다.

---

## 12. 기술 스택

| 영역 | 스택 |
|---|---|
| 프레임워크 | Next.js 15 (App Router) |
| 스타일링 | Tailwind CSS v4 |
| DB / Auth / Storage | Supabase (PostgreSQL + RLS + Storage) |
| QR 생성 | `qrcode` |
| QR 스캔 | `html5-qrcode` 또는 `jsQR` |
| 서명 | HMAC-SHA256 (Web Crypto API) |
| 배포 | Vercel |

Supabase RLS로 `market_participants.role`을 기준으로 권한을 분리한다. 포인트 차감과 `point_logs` insert는 트랜잭션으로 묶어서 잔액 꼬임을 방지한다.

---

## 13. 달란트 적립 구조 참고 (2025 바울공동체 수련회 기준)

| 구간 | 미션 | 달란트 |
|---|---|---|
| 2주 전 모임 | QT 인증, 예배 참석 등 | 5 |
| 1주 전 모임 | QT 인증, 예배 참석 등 | 5 |
| 수련회 1일차 | 레크레이션 | 3 |
| 수련회 2일차 | 레크레이션 | 3 |
| 사이드 미션 | 칭찬, 투샷, 설교노트, 암송 등 | 최대 23 |
| 합계 | | 최대 약 39 |

성실 참여 기준 30~34달란트 예상. 마켓 물품 평균 단가 4.5~5달란트 기준, 5~6개 구매 가능한 수준이다.
