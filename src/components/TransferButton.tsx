"use client";

import { ArrowRightLeft } from "lucide-react";
import { TransferModal } from "@/components/TransferModal";
import { openModal } from "@/lib/overlay";

interface TransferButtonProps {
  marketId: string;
  userId: string;
}

export function TransferButton({ marketId, userId }: TransferButtonProps) {
  return (
    <button
      type="button"
      onClick={() =>
        openModal((close) => (
          <TransferModal marketId={marketId} userId={userId} onClose={close} />
        ))
      }
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 active:scale-95 transition-transform self-center"
    >
      <ArrowRightLeft className="h-5 w-5" />
    </button>
  );
}
