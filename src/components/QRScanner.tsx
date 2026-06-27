'use client'

import { Children, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, QrCode } from 'lucide-react'
import jsQR from 'jsqr'

interface QRScannerProps {
  open: boolean
  title: string
  hint?: string
  badge?: ReactNode
  onScan: (value: string) => void
  onSimulate?: () => void
  onClose: () => void
  children?: ReactNode
}

export function QRScanner({
  open, title, hint, badge, onScan, onSimulate, onClose, children,
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const onScanRef = useRef(onScan)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState(false)

  useEffect(() => { onScanRef.current = onScan }, [onScan])

  // Children.toArray filters out null/undefined/boolean — {false}{false} → []
  // Children.count does NOT filter them (false counts as 1), so use toArray here
  const hasOverlay = Children.toArray(children).length > 0
  const shouldScan = open && !hasOverlay

  useEffect(() => {
    if (!shouldScan) {
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setCameraReady(false)
      setCameraError(false)
      return
    }

    let active = true

    function scanFrame() {
      if (!active) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(img.data, img.width, img.height)
          if (code?.data) {
            active = false
            cancelAnimationFrame(rafRef.current)
            streamRef.current?.getTracks().forEach((t) => t.stop())
            streamRef.current = null
            onScanRef.current(code.data)
            return
          }
        }
      }
      rafRef.current = requestAnimationFrame(scanFrame)
    }

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        })
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        if (!active) return
        setCameraReady(true)
        scanFrame()
      } catch {
        if (active) setCameraError(true)
      }
    }

    startCamera()

    return () => {
      active = false
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setCameraReady(false)
    }
  }, [shouldScan])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div className="flex items-center px-4 pt-14">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="ml-3 text-sm font-semibold text-white">{title}</p>
        {badge && <div className="ml-auto">{badge}</div>}
      </div>

      {hasOverlay ? children : (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative h-64 w-64 overflow-hidden rounded-3xl">
              <video
                ref={videoRef}
                className={`h-full w-full object-cover transition-opacity duration-300 ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="pointer-events-none absolute inset-0 rounded-3xl border-4 border-white/40" />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <QrCode className="h-24 w-24 text-white/20" />
                </div>
              )}
            </div>

            {hint && <p className="text-sm text-white/60">{hint}</p>}

            {cameraReady && !cameraError && (
              <p className="animate-pulse text-xs text-white/40">QR 코드를 인식하는 중…</p>
            )}

            {onSimulate && (
              <button
                type="button"
                onClick={onSimulate}
                className="rounded-full bg-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white/30"
              >
                {cameraError ? '카메라 권한 없음 — 시뮬레이션으로 진행' : '스캔 시뮬레이션'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
