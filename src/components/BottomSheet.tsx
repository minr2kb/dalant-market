'use client'

import { Drawer } from 'vaul'
import type { ReactNode } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={(o) => { if (!o) onClose() }}
      // vaul renders into a portal at document.body — always above nav (z-50)
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[70] bg-black/40" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-[70] rounded-t-3xl bg-white focus:outline-none"
          style={{ maxHeight: '90svh', overflow: 'hidden' }}
          aria-describedby={undefined}
        >
          {/* inner scroll container — vaul Content must not overflow itself */}
          <div style={{ maxHeight: '90svh', overflowY: 'auto' }}>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
