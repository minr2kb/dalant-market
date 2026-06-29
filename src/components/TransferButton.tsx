'use client'

import { useState, useCallback } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { TransferModal } from '@/components/TransferModal'

interface TransferButtonProps {
  marketId: string
  userId: string
}

export function TransferButton({ marketId, userId }: TransferButtonProps) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 active:scale-95 transition-transform self-center"
      >
        <ArrowUpRight className="h-5 w-5" />
      </button>
      <TransferModal
        marketId={marketId}
        userId={userId}
        open={open}
        onClose={close}
      />
    </>
  )
}
