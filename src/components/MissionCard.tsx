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
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                  단체
                </span>
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

        {mission.limitCount > 1 && mission.slots && (
          <div className="flex gap-1.5">
            {mission.slots.map((slot) => (
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
          <p className="text-xs text-gray-400">
            {completedCount}/{mission.limitCount}회 완료
          </p>
        )}
      </div>
    </Link>
  )
}
