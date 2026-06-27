import type { Market, MarketParticipant, Mission, PointLog, Order, MarketItem } from '@/types'

// UUIDs match the seeded Supabase rows
const U1 = 'aaaaaaaa-0000-0000-0000-000000000001' // 김민준
const U2 = 'aaaaaaaa-0000-0000-0000-000000000002' // 이서연
const U3 = 'aaaaaaaa-0000-0000-0000-000000000003' // 박지훈 (admin)
const U4 = 'aaaaaaaa-0000-0000-0000-000000000004' // 최예린
const U5 = 'aaaaaaaa-0000-0000-0000-000000000005' // 정승현
const MKT = 'bbbbbbbb-0000-0000-0000-000000000001'
const M1 = 'cccccccc-0000-0000-0000-000000000001'
const M2 = 'cccccccc-0000-0000-0000-000000000002'
const M3 = 'cccccccc-0000-0000-0000-000000000003'
const M4 = 'cccccccc-0000-0000-0000-000000000004'
const M5 = 'cccccccc-0000-0000-0000-000000000005'
const M6 = 'cccccccc-0000-0000-0000-000000000006'
const M7 = 'cccccccc-0000-0000-0000-000000000007'

export const MOCK_MARKET: Market = {
  id: MKT,
  title: '2025 바울공동체 수련회',
  description: '2박 3일 수련회 달란트 마켓',
  pointLabel: '달란트',
  adminCode: 'ADMIN1234',
  startsAt: '2025-08-01T09:00:00Z',
  endsAt: '2025-08-03T18:00:00Z',
  createdAt: '2025-07-01T00:00:00Z',
}

export const MOCK_PARTICIPANTS: MarketParticipant[] = [
  {
    id: 'p1',
    marketId: MKT,
    user: { id: U1, name: '김민준', realName: '김민준', birthDate: '2003-04-12', gender: 'male', createdAt: '2025-07-15T00:00:00Z' },
    role: 'user',
    balance: 28,
  },
  {
    id: 'p2',
    marketId: MKT,
    user: { id: U2, name: '이서연', realName: '이서연', birthDate: '2004-09-23', gender: 'female', createdAt: '2025-07-15T00:00:00Z' },
    role: 'user',
    balance: 34,
  },
  {
    id: 'p3',
    marketId: MKT,
    user: { id: U3, name: '박지훈', realName: '박지훈', birthDate: '1988-03-05', gender: 'male', createdAt: '2025-07-10T00:00:00Z' },
    role: 'admin',
    balance: 15,
  },
  {
    id: 'p4',
    marketId: MKT,
    user: { id: U4, name: '최예린', realName: '최예린', birthDate: '2002-11-30', gender: 'female', createdAt: '2025-07-15T00:00:00Z' },
    role: 'user',
    balance: 21,
  },
  {
    id: 'p5',
    marketId: MKT,
    user: { id: U5, name: '정승현', realName: '정승현', birthDate: '2003-07-18', gender: 'male', createdAt: '2025-07-15T00:00:00Z' },
    role: 'user',
    balance: 16,
  },
]

export const MOCK_CURRENT_USER = MOCK_PARTICIPANTS[2]
export const MOCK_CURRENT_USER_ID = MOCK_CURRENT_USER['user']['id']

export const MOCK_MISSIONS: Mission[] = [
  // past
  {
    id: M1,
    marketId: MKT,
    title: 'QT 인증',
    description: '매일 아침 QT 후 관리자에게 QR 인증을 받으세요.',
    type: 'admin_qr',
    isGroup: false,
    reward: 5,
    limitCount: 3,
    activeFrom: '2026-06-08T00:00:00Z',
    activeUntil: '2026-06-18T23:59:59Z',
    isActive: false,
    slots: [
      { slot: 1, verifiedByName: '박지훈', verifiedAt: '2026-06-09T08:30:00Z', photoUrl: null },
      { slot: 2, verifiedByName: '박지훈', verifiedAt: '2026-06-12T08:45:00Z', photoUrl: null },
      { slot: 3, verifiedByName: null, verifiedAt: null, photoUrl: null },
    ],
  },
  {
    id: M2,
    marketId: MKT,
    title: '설교노트 제출',
    description: '설교 내용을 정리한 노트를 사진으로 찍어 업로드하세요.',
    type: 'upload',
    isGroup: false,
    reward: 5,
    limitCount: 1,
    activeFrom: '2026-06-08T00:00:00Z',
    activeUntil: '2026-06-20T23:59:59Z',
    isActive: false,
    slots: [
      { slot: 1, verifiedByName: '박지훈', verifiedAt: '2026-06-10T11:00:00Z', photoUrl: '/mock-photo.jpg' },
    ],
  },
  // active
  {
    id: M3,
    marketId: MKT,
    title: '칭찬 2마디',
    description: '다른 참여자에게 진심 어린 칭찬을 건네고 상대방의 QR을 스캔하세요.',
    type: 'user_qr',
    isGroup: false,
    reward: 3,
    limitCount: 2,
    activeFrom: '2026-06-22T00:00:00Z',
    activeUntil: '2026-06-28T23:59:59Z',
    isActive: true,
    slots: [
      { slot: 1, verifiedByName: '이서연', verifiedAt: '2026-06-23T14:32:00Z', photoUrl: null },
      { slot: 2, verifiedByName: null, verifiedAt: null, photoUrl: null },
    ],
  },
  {
    id: M6,
    marketId: MKT,
    title: '기도제목 나누기',
    description: '다른 참여자와 서로의 기도제목을 나누고 상대방의 QR을 스캔하세요.',
    type: 'user_qr',
    isGroup: false,
    reward: 3,
    limitCount: 1,
    activeFrom: '2026-06-20T00:00:00Z',
    activeUntil: '2026-06-27T23:59:59Z',
    isActive: true,
    slots: [{ slot: 1, verifiedByName: null, verifiedAt: null, photoUrl: null }],
  },
  {
    id: M7,
    marketId: MKT,
    title: '예배 참석',
    description: '예배에 참석 후 관리자에게 QR 인증을 받으세요.',
    type: 'admin_qr',
    isGroup: false,
    reward: 5,
    limitCount: 2,
    activeFrom: '2026-06-23T00:00:00Z',
    activeUntil: '2026-06-30T23:59:59Z',
    isActive: true,
    slots: [
      { slot: 1, verifiedByName: '박지훈', verifiedAt: '2026-06-24T10:30:00Z', photoUrl: null },
      { slot: 2, verifiedByName: null, verifiedAt: null, photoUrl: null },
    ],
  },
  // upcoming
  {
    id: M4,
    marketId: MKT,
    title: '팀원 전체 포즈샷',
    description: '팀원 전원이 함께 찍은 사진을 업로드하세요. 단체 미션으로 전원 달란트 지급.',
    type: 'upload',
    isGroup: true,
    reward: 4,
    limitCount: 1,
    activeFrom: '2026-07-01T00:00:00Z',
    activeUntil: '2026-07-03T23:59:59Z',
    isActive: false,
    slots: [{ slot: 1, verifiedByName: null, verifiedAt: null, photoUrl: null }],
  },
  {
    id: M5,
    marketId: MKT,
    title: '레크레이션 1일차',
    description: '1일차 레크레이션 활동에 참여하고 관리자에게 QR 인증을 받으세요.',
    type: 'admin_qr',
    isGroup: false,
    reward: 3,
    limitCount: 1,
    activeFrom: '2026-07-01T00:00:00Z',
    activeUntil: '2026-07-01T23:59:59Z',
    isActive: false,
    slots: [{ slot: 1, verifiedByName: null, verifiedAt: null, photoUrl: null }],
  },
]

export const MOCK_POINT_LOGS: PointLog[] = [
  { id: 'pl1', marketId: MKT, userId: U1, amount: 5,  reasonType: 'mission',  missionTitle: 'QT 인증',     verifiedByName: '박지훈', createdAt: '2025-07-18T08:30:00Z' },
  { id: 'pl2', marketId: MKT, userId: U1, amount: 5,  reasonType: 'mission',  missionTitle: '설교노트 제출', verifiedByName: '박지훈', createdAt: '2025-07-20T11:00:00Z' },
  { id: 'pl3', marketId: MKT, userId: U1, amount: -8, reasonType: 'purchase', itemName: '아이스크림 세트 외 1건', orderId: 'o1', createdAt: '2025-08-01T15:00:00Z' },
  { id: 'pl4', marketId: MKT, userId: U1, amount: 3,  reasonType: 'mission',  missionTitle: '칭찬 2마디',   verifiedByName: '이서연', createdAt: '2025-08-01T14:32:00Z' },
  { id: 'pl5', marketId: MKT, userId: U1, amount: 5,  reasonType: 'mission',  missionTitle: 'QT 인증',     verifiedByName: '박지훈', createdAt: '2025-07-20T08:45:00Z' },
  { id: 'pl6', marketId: MKT, userId: U1, amount: 3,  reasonType: 'manual',   memo: '출석 보너스',           createdAt: '2025-08-02T09:00:00Z' },
  { id: 'pl7', marketId: MKT, userId: U1, amount: -5, reasonType: 'purchase', itemName: '음료수',           orderId: 'o2', createdAt: '2025-08-02T13:00:00Z' },
]

export const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    marketId: MKT,
    userId: U1,
    verifiedByName: '박지훈',
    items: [{ name: '아이스크림 세트', price: 5, qty: 1 }, { name: '사탕', price: 3, qty: 1 }],
    total: 8,
    purchasedAt: '2025-08-01T15:00:00Z',
  },
  {
    id: 'o2',
    marketId: MKT,
    userId: U1,
    verifiedByName: '김임원',
    items: [{ name: '음료수', price: 5, qty: 1 }],
    total: 5,
    purchasedAt: '2025-08-02T13:00:00Z',
  },
]

export const MOCK_MARKET_ITEMS: MarketItem[] = [
  { id: 'i1', name: '아이스크림 세트', price: 5 },
  { id: 'i2', name: '음료수',         price: 5 },
  { id: 'i3', name: '사탕',           price: 3 },
  { id: 'i4', name: '과자 세트',      price: 4 },
  { id: 'i5', name: '초콜릿',         price: 3 },
  { id: 'i6', name: '젤리',           price: 2 },
  { id: 'i7', name: '라면',           price: 4 },
  { id: 'i8', name: '컵라면',         price: 3 },
]
