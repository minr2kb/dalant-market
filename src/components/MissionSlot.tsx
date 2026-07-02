import { CheckCircle2, QrCode } from "lucide-react";
import type { MissionSlotData } from "@/types";

interface MissionSlotProps {
  slot: MissionSlotData;
  slotNumber: number;
}

export function MissionSlot({ slot, slotNumber }: MissionSlotProps) {
  const isVerified = slot.verifiedAt !== null;

  return (
    <div
      className={`rounded-2xl border p-4 space-y-2 ${
        isVerified
          ? "border-emerald-100 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/30"
          : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
      }`}
    >
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
        {slotNumber}회차
      </p>
      {isVerified ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {slot.verifiedByName} 확인
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(slot.verifiedAt!).toLocaleString("ko-KR", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
          <QrCode className="h-4 w-4" />
          <span className="text-sm">QR 대기중</span>
        </div>
      )}
    </div>
  );
}
