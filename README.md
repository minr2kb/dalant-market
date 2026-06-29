# 달란트페이

> 오프라인 모임을 위한 미션 인증 기반 달란트 결제 서비스

---

## 서비스 소개

달란트페이는 수련회·MT·행사 등 오프라인 모임에서 미션을 수행하고 달란트(포인트)를 적립한 뒤, 마켓에서 사용하는 전 과정을 웹으로 처리하는 서비스입니다.

실물 달란트나 종이 미션표 없이, 스마트폰 하나로 미션 인증부터 마켓 결제까지 처리합니다.

---

## 주요 기능

### 일반 참여자
- **미션 인증** — QR 코드 또는 사진 업로드로 미션을 인증하고 달란트를 즉시 적립
- **달란트 내역** — 적립·차감·구매 내역을 타임라인으로 확인
- **마켓 결제** — 홈 화면에서 결제 QR을 생성하면 관리자가 스캔해서 즉시 차감

### 관리자
- **QR 스캔** — 참여자가 제시한 QR을 스캔해 미션 인증 또는 마켓 결제를 즉시 처리
- **달란트 관리** — 참여자별 수동 지급·차감 및 전체 잔액 현황 확인
- **미션 관리** — 미션 추가, 활성화/비활성화, 인증 타입·보상·횟수 설정
- **마켓 POS** — 물품을 선택하고 참여자 QR을 스캔해 결제 처리
- **유저 관리** — 참여자별 달란트 잔액, 미션 완료 현황 확인

---

## 미션 인증 타입

| 타입 | 설명 |
|------|------|
| `user_qr` | 미션 수행자가 QR 생성 → 다른 참여자가 스캔 |
| `upload` | 사진 업로드 후 QR 생성 → 관리자가 스캔 |
| `admin_qr` | 미션 수행자가 QR 생성 → 관리자가 스캔 |
| `manual` | 인증 없음 — 관리자가 수동 지급 |

단체 미션(`is_group`)의 경우, 스캔 후 참여자를 추가 선택해 일괄 적립할 수 있습니다.

---

## 기술 스택

| 영역 | 스택 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| UI | shadcn/ui + Tailwind CSS v4 |
| 인증 | Kakao OAuth (Supabase Auth) |
| DB / Storage | Supabase (PostgreSQL + RLS) |
| 배포 | Vercel |

---

## 라우팅 구조

```
/login                              카카오 로그인
/onboarding                         최초 1회 본명·생일·성별 입력
/markets                            마켓 목록
/markets/[id]/home                  유저 홈 (잔액, 결제 QR, 최근 내역)
/markets/[id]/missions              미션 목록
/markets/[id]/missions/[missionId]  미션 상세 및 인증
/markets/[id]/history               달란트 내역
/markets/[id]/admin/home            관리자 홈
/markets/[id]/admin/scan            QR 스캔
/markets/[id]/admin/points          달란트 수동 관리
/markets/[id]/admin/missions        미션 관리
/markets/[id]/admin/pos             마켓 POS
/markets/[id]/admin/users           유저 관리
```

---

## 로컬 개발

```bash
pnpm install
pnpm dev
```

환경변수는 `.env.local`에 Supabase 프로젝트 URL과 anon key를 설정합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
