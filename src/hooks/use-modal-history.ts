'use client'

import { useEffect, useCallback } from 'react'

export function useModalHistory(open: boolean, onClose: () => void) {
  const close = useCallback(onClose, [onClose])

  useEffect(() => {
    if (!open) return
    window.history.pushState(null, '')
    window.addEventListener('popstate', close)
    return () => window.removeEventListener('popstate', close)
  }, [open, close])
}
