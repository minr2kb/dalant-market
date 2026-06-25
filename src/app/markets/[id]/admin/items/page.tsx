'use client'

import { useState } from 'react'
import {
  Plus, Minus, ShoppingCart, Trash2, QrCode, CheckCircle2, ChevronLeft, X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MOCK_MARKET_ITEMS, MOCK_PARTICIPANTS } from '@/lib/mock-data'
import type { MarketItem, MarketParticipant } from '@/types'

type CartEntry = { item: MarketItem; qty: number }
type Tab = 'sell' | 'manage'
type ScanState = 'idle' | 'scanning' | 'confirm' | 'done'

export default function AdminItemsPage() {
  const [tab, setTab] = useState<Tab>('sell')

  // ── 판매 ──────────────────────────────────────────────────
  const [cart, setCart] = useState<CartEntry[]>([])
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [scannedUser, setScannedUser] = useState<MarketParticipant | null>(null)

  // ── 관리 ──────────────────────────────────────────────────
  const [items, setItems] = useState<MarketItem[]>(MOCK_MARKET_ITEMS)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')

  const total = cart.reduce((s, e) => s + e.item.price * e.qty, 0)

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

  function mockScan() {
    // mock: scan first participant's payment QR
    const user = MOCK_PARTICIPANTS[0]
    setScannedUser(user)
    setScanState('confirm')
  }

  function confirmPayment() {
    setScanState('done')
  }

  function resetScan() {
    setScanState('idle')
    setScannedUser(null)
    setCart([])
  }

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
    <>
      <div className="px-4 pt-14 max-w-lg mx-auto space-y-5">
        <h1 className="text-xl font-bold text-gray-900">물품 관리</h1>

        {/* 탭 */}
        <div className="flex gap-2">
          {(['sell', 'manage'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`h-9 rounded-full px-5 text-sm font-medium transition-colors ${
                tab === t ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {t === 'sell' ? '판매' : '관리'}
            </button>
          ))}
        </div>

        {tab === 'sell' && (
          <div className="space-y-4">
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
                        <span className="w-12 text-right text-sm tabular-nums text-rose-500">-{item.price * qty}</span>
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

            {cart.length > 0 ? (
              <Button
                onClick={() => setScanState('scanning')}
                className="h-12 w-full rounded-2xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                <QrCode className="mr-2 h-5 w-5" />
                결제하기 ({total} 달란트)
              </Button>
            ) : (
              <p className="py-4 text-center text-sm text-gray-400">물품을 선택하면 장바구니에 담겨요</p>
            )}
          </div>
        )}

        {tab === 'manage' && (
          <div className="space-y-4">
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
                className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

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

      {/* QR 스캔 전체화면 오버레이 */}
      {scanState !== 'idle' && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          {/* 상단 */}
          <div className="flex items-center px-4 pt-14">
            <button
              type="button"
              onClick={() => setScanState('idle')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="ml-3 text-sm font-semibold text-white">결제 QR 스캔</p>
            <div className="ml-auto rounded-full bg-white/10 px-3 py-1 text-sm font-bold tabular-nums text-white">
              -{total} 달란트
            </div>
          </div>

          {/* 뷰파인더 */}
          {scanState === 'scanning' && (
            <div className="flex flex-1 items-center justify-center">
              <div className="space-y-6 text-center">
                <div className="flex h-64 w-64 items-center justify-center rounded-3xl border-4 border-white/30">
                  <QrCode className="h-24 w-24 text-white/20" />
                </div>
                <p className="text-sm text-white/60">사용자의 결제 QR을 스캔하세요</p>
                <button
                  type="button"
                  onClick={mockScan}
                  className="rounded-full bg-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white/30"
                >
                  스캔 시뮬레이션
                </button>
              </div>
            </div>
          )}

          {/* 확인 바텀시트 */}
          {scanState === 'confirm' && scannedUser && (
            <>
              <div className="flex flex-1 items-center justify-center">
                <div className="flex h-64 w-64 items-center justify-center rounded-3xl border-4 border-emerald-400/50">
                  <QrCode className="h-24 w-24 text-emerald-400/40" />
                </div>
              </div>
              <div className="rounded-t-3xl bg-white px-6 pb-28 pt-6 space-y-5">
                <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-base font-bold text-gray-600 shrink-0">
                    {scannedUser.user.realName[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{scannedUser.user.realName}</p>
                    <p className="text-sm text-gray-500">
                      잔액 {scannedUser.balance} → {scannedUser.balance - total}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-1">
                  {cart.map(({ item, qty }) => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-600">
                      <span>{item.name} × {qty}</span>
                      <span className="tabular-nums">{item.price * qty}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-gray-100 pt-2 text-sm font-bold">
                    <span>합계</span>
                    <span className="tabular-nums text-rose-500">-{total}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setScanState('scanning')}
                    className="h-12 flex-1 rounded-full text-sm font-semibold"
                  >
                    다시 스캔
                  </Button>
                  <Button
                    onClick={confirmPayment}
                    className="h-12 flex-1 rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600"
                  >
                    결제 확인
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* 완료 */}
          {scanState === 'done' && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <CheckCircle2 className="h-20 w-20 text-emerald-400" />
              <div>
                <p className="text-xl font-bold text-white">결제 완료!</p>
                <p className="mt-1 text-sm text-white/60">
                  {scannedUser?.user.realName} · -{total} 달란트
                </p>
              </div>
              <Button
                onClick={resetScan}
                className="mt-4 h-12 w-full max-w-xs rounded-full bg-white text-sm font-semibold text-gray-900 hover:bg-white/90"
              >
                다음 결제
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
