'use client'

import { overlay } from 'overlay-kit'
import { useEffect, type ReactNode } from 'react'

function HistoryAwareModal({
  close,
  unmount,
  render,
}: {
  close: () => void
  unmount: () => void
  render: (close: () => void) => ReactNode
}) {
  useEffect(() => {
    window.history.pushState({ overlay: true }, '')
    const handlePop = () => { close(); unmount() }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [close, unmount])

  return <>{render(() => window.history.back())}</>
}

export function openModal(render: (close: () => void) => ReactNode) {
  overlay.open(({ close, unmount }) => (
    <HistoryAwareModal close={close} unmount={unmount} render={render} />
  ))
}
