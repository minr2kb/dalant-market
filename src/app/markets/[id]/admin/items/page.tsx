'use client'

import { useState } from 'react'
import { Plus, Minus, ShoppingCart, Trash2, QrCode, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MOCK_MARKET_ITEMS, MOCK_PARTICIPANTS } from '@/lib/mock-data'
import type { MarketItem } from '@/types'

type CartEntry = { item: MarketItem; qty: number }
type Tab = 'sell' | 'manage'

export default function AdminItemsPage() {
  const [tab, setTab] = useState<Tab>('sell')

  // ── 판매 탭 상태 ──────────────────────────────────────────
  const [cart, setCart] = useState<CartEntry[]>([])
  const [userId, setUserId] = useState('')
  const [result, setResult] = useState<'success' | 'error' | null>(null)

  // ── 관리 탭 상태 ──────────────────────────────────────────
  const [items, setItems] = useState<MarketItem[]>(MOCK_MARKET_ITEMS)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')

  // ── 장바구니 ──────────────────────────────────────────────
  function addToCart(item: MarketItem) {
    setCart((prev) => {
      const existing = prev.find((e) => e.item.id === item.id)
      return existing
        ? prev.map((e) => e.item.id === item.id ? { ...e, qty: e.qty + 1 } : e)
        : [...prev, { item, qty: 1 }]
    })
  }

  function setQty(itemId: string, qty: number) {
    if (qty <= 0) setCart((prev) => prev.filter((e) => e.item.id !== itemId))
    else setCart((prev) => prev.map((e) => e.item.id === itemId ? { ...e, qty } : e))
  }

  const total = cart.reduce((s, e) => s + e.item.price * e.qty, 0)

  function checkout() {
    const participant = MOCK_PARTICIPANTS.find(
      (p) => p.user.realName === userId.trim() || p.user.id === userId.trim()
    )
    if (!participant || participant.balance < total) {
      setResult('error')
      setTimeout(() => setResult(null), 2000)
      return
    }
    setResult('success')
    setCart([])
    setUserId('')
    setTimeout(() => setResult(null), 2500)
  }

  // ── 물품 관리 ─────────────────────────────────────────────
  function addItem() {
    if (!newName.trim() || !newPrice) return
    setItems((prev) => [
      ...prev,
      { id: `item_${Date.now()}`, name: newName.trim(), price: Number(newPrice) },
    ])
    setNewName('')
    setNewPrice('')
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="px-4 pt-14 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">물품 관리</h1>

      {/* 탭 */}
      <div className="flex gap-2">
        {(['sell', 'manage'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {t === 'sell' ? '판매' : '관리'}
          </button>
        ))}
      </div>

      {tab === 'sell' && (
        <div className="space-y-4">
          {/* 물품 목록 */}
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => {
              const inCart = cart.find((e) => e.item.id === item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addToCart(item)}
                  className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition-colors active:scale-95 ${
                    inCart
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-gray-100 bg-white hover:bg-gray-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                  <p className="text-base font-bold tabular-nums text-emerald-500">{item.price}</p>
                  {inCart && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                      {inCart.qty}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* 장바구니 */}
          {cart.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
                <ShoppingCart className="h-4 w-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-700">장바구니</p>
              </div>
              <div className="divide-y divide-gray-50">
                {cart.map(({ item, qty }) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3">
                    <p className="text-sm text-gray-700">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQty(item.id, qty - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(item.id, qty + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <span className="w-12 text-right text-sm font-medium tabular-nums text-rose-500">
                        -{item.price * qty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                <span className="text-sm font-semibold text-gray-700">합계</span>
                <span className="text-base font-bold tabular-nums text-rose-500">-{total}</span>
              </div>
            </div>
          )}

          {/* 유저 입력 + 결제 */}
          {cart.length > 0 && (
            <div className="space-y-2">
              <div className="relative">
                <QrCode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="유저 이름 또는 ID 입력 (QR 스캔)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="rounded-xl pl-9"
                />
              </div>

              {result === 'success' && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">
                  <CheckCircle className="h-4 w-4" /> 결제 완료
                </div>
              )}
              {result === 'error' && (
                <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-500">
                  유저를 찾을 수 없거나 잔액이 부족해요
                </div>
              )}

              <Button
                onClick={checkout}
                disabled={!userId.trim() || result !== null}
                className="h-12 w-full rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 text-sm font-semibold disabled:opacity-40"
              >
                {total} 달란트 차감하기
              </Button>
            </div>
          )}

          {cart.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">물품을 선택하면 장바구니에 담겨요</p>
          )}
        </div>
      )}

      {tab === 'manage' && (
        <div className="space-y-4">
          {/* 추가 폼 */}
          <div className="flex gap-2">
            <Input
              placeholder="물품명"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-xl flex-1"
            />
            <Input
              placeholder="가격"
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="rounded-xl w-24"
            />
            <Button
              onClick={addItem}
              size="sm"
              className="shrink-0 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* 물품 목록 */}
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                  <p className="text-xs font-medium tabular-nums text-emerald-500">{item.price} 달란트</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 hover:bg-rose-50 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">등록된 물품이 없어요</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
