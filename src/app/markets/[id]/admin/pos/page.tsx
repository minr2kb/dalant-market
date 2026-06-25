'use client'

import { useState } from 'react'
import { Plus, Minus, QrCode, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MOCK_MARKET_ITEMS, MOCK_MARKET } from '@/lib/mock-data'
import type { MarketItem } from '@/types'

interface CartItem extends MarketItem {
  qty: number
}

type PosState = 'shopping' | 'scanning' | 'done'

export default function PosPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [posState, setPosState] = useState<PosState>('shopping')

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const market = MOCK_MARKET

  function addItem(item: MarketItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id)
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
      }
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function changeQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0),
    )
  }

  function handleScan() {
    setPosState('scanning')
    setTimeout(() => setPosState('done'), 2000)
  }

  function reset() {
    setCart([])
    setPosState('shopping')
  }

  return (
    <div className="flex min-h-svh flex-col bg-gray-50">
      <div className="flex-1 px-4 pt-14 max-w-lg mx-auto w-full space-y-5">
        <h1 className="text-xl font-bold text-gray-900">마켓 POS</h1>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MOCK_MARKET_ITEMS.map((item) => {
            const cartItem = cart.find((c) => c.id === item.id)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => addItem(item)}
                className="relative rounded-2xl border border-gray-100 bg-white p-4 text-left transition-transform active:scale-95"
              >
                {cartItem && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                    {cartItem.qty}
                  </span>
                )}
                <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                <p className="text-xs font-bold text-emerald-500">
                  {item.price} {market.pointLabel}
                </p>
              </button>
            )
          })}
        </div>

        {cart.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">선택 목록</h2>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeQty(item.id, -1)}
                      className="rounded-full p-1 hover:bg-gray-100"
                    >
                      <Minus className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeQty(item.id, 1)}
                      className="rounded-full p-1 hover:bg-gray-100"
                    >
                      <Plus className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <span className="w-10 text-right text-sm font-medium text-gray-700 tabular-nums">
                      {item.price * item.qty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-gray-50 pt-3">
              <span className="text-sm font-semibold text-gray-700">합계</span>
              <span className="text-lg font-bold tabular-nums text-emerald-500">
                {total} {market.pointLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-24 px-4 pb-2 max-w-lg mx-auto w-full">
        {posState === 'shopping' && (
          <Button
            onClick={handleScan}
            disabled={cart.length === 0}
            className="w-full rounded-full bg-emerald-500 py-3 text-base font-medium text-white hover:bg-emerald-600 disabled:opacity-40 shadow-lg shadow-emerald-200"
          >
            <QrCode className="mr-2 h-5 w-5" />
            유저 QR 스캔으로 결제
          </Button>
        )}

        {posState === 'scanning' && (
          <div className="flex items-center justify-center rounded-full bg-gray-100 py-3 text-sm text-gray-500">
            QR 스캔 중...
          </div>
        )}

        {posState === 'done' && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 rounded-full bg-emerald-50 py-3 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              결제 완료 — {total} {market.pointLabel} 차감
            </div>
            <Button onClick={reset} variant="outline" className="w-full rounded-full">
              새 결제
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
