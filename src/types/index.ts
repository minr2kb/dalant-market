export type Role = 'admin' | 'user'
export type MissionType = 'user_qr' | 'upload' | 'admin_qr' | 'manual'
export type PointReasonType = 'mission' | 'purchase' | 'manual' | 'transfer'
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
  adminCode: string
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
  displayName: string
}

export interface MissionSlotData {
  slot: number
  verifiedByName: string | null
  verifiedAt: string | null
  photoUrl: string | null
}

export type MissionStatus = 'active' | 'upcoming' | 'past'

export interface Mission {
  id: string
  marketId: string
  title: string
  description?: string
  type: MissionType
  isGroup: boolean
  reward: number
  limitCount: number | null
  activeFrom: string | null
  activeUntil: string | null
  isActive: boolean
  slots?: MissionSlotData[]
}

export function getMissionStatus(mission: Mission): MissionStatus {
  if (!mission.isActive) return 'past'
  const now = new Date()
  if (mission.activeUntil && new Date(mission.activeUntil) < now) return 'past'
  if (mission.activeFrom && new Date(mission.activeFrom) > now) return 'upcoming'
  return 'active'
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
  orderId?: string
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

export interface MarketItem {
  id: string
  name: string
  price: number
}

export function getPointLogLabel(log: PointLog): string {
  switch (log.reasonType) {
    case 'mission': return log.missionTitle ?? '미션'
    case 'purchase': return log.itemName ?? '마켓 구매'
    case 'transfer': return log.memo ?? '달란트 전송'
    case 'manual': return log.memo ?? '수동 지급'
  }
}
