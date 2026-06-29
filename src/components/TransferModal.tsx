'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { X, ArrowLeft, Search, UserRound, QrCode } from 'lucide-react'
import { QRScanner } from '@/components/QRScanner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useModalHistory } from '@/hooks/use-modal-history'
import { parseQR } from '@/lib/qr'
import { participantsQuery } from '@/lib/query/queries'
import { transferApi } from '@/lib/api/client'
import type { MarketParticipant } from '@/types'

type Step = 'select' | 'amount' | 'confirm'

interface TransferModalProps {
  marketId: string
  userId: string
  open: boolean
  onClose: () => void
}

export function TransferModal({ marketId, userId, open, onClose }: TransferModalProps) {
  const close = useCallback(() => onClose(), [onClose])
  useModalHistory(open, close)

  const [step, setStep] = useState<Step>('select')
  const [activeTab, setActiveTab] = useState<'qr' | 'search'>('qr')
  const [scanOpen, setScanOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [recipient, setRecipient] = useState<MarketParticipant | null>(null)
  const [amount, setAmount] = useState('')
  const [scanError, setScanError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setStep('select')
      setActiveTab('qr')
      setScanOpen(false)
      setSearch('')
      setRecipient(null)
      setAmount('')
      setScanError(null)
    }
  }, [open])

  // 모달이 열릴 때만 참가자 목록 조회
  const { data: participantsData } = useQuery({
    ...participantsQuery.list({ marketId }),
    enabled: open,
  })
  const participants = useMemo(
    () => (participantsData?.data ?? []).filter((p) => p.user.id !== userId),
    [participantsData, userId],
  )
  const filtered = useMemo(
    () =>
      participants.filter((p) =>
        p.user.realName.toLowerCase().includes(search.toLowerCase()),
      ),
    [participants, search],
  )

  const { mutate: doTransfer, isPending } = useMutation({
    mutationFn: ({ toUserId, amount }: { toUserId: string; amount: number }) =>
      transferApi.transfer({ path: { marketId }, body: { toUserId, amount } }),
    onSuccess: () => {
      queryClient.invalidateQueries()
      window.history.back()
    },
  })

  function handleScan(value: string) {
    setScanOpen(false)
    const parsed = parseQR(value)
    if (!parsed || parsed.type !== 'pay') {
      setScanError('올바른 QR이 아니에요')
      return
    }
    if (parsed.marketId !== marketId) {
      setScanError('다른 마켓의 QR이에요')
      return
    }
    if (parsed.userId === userId) {
      setScanError('자신에게는 전송할 수 없어요')
      return
    }
    const found = participants.find((p) => p.user.id === parsed.userId)
    if (!found) {
      setScanError('이 마켓의 참가자가 아니에요')
      return
    }
    setScanError(null)
    setRecipient(found)
    setStep('amount')
  }

  function handleSelectRecipient(p: MarketParticipant) {
    setRecipient(p)
    setStep('amount')
  }

  function handleAmountNext() {
    const n = parseInt(amount, 10)
    if (!n || n < 1) return
    setStep('confirm')
  }

  function handleConfirm() {
    if (!recipient) return
    doTransfer({ toUserId: recipient.user.id, amount: parseInt(amount, 10) })
  }

  if (!open) return null

  // QR 스캔 화면 (full-screen)
  if (scanOpen) {
    return (
      <QRScanner
        open={scanOpen}
        title="QR 스캔"
        hint="상대방의 결제용 QR을 스캔하세요"
        onScan={handleScan}
        onClose={() => setScanOpen(false)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-6">
      <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 pb-10 space-y-5 sm:rounded-3xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {step !== 'select' && (
              <button
                type="button"
                onClick={() => setStep(step === 'confirm' ? 'amount' : 'select')}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h3 className="font-bold text-gray-900">
              {step === 'select' ? '달란트 전송' : step === 'amount' ? '금액 입력' : '전송 확인'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step 1: 수신자 선택 */}
        {step === 'select' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(['qr', 'search'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => { setActiveTab(tab); setScanError(null) }}
                  className={`flex-1 h-9 rounded-full text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {tab === 'qr' ? 'QR 스캔' : '이름 검색'}
                </button>
              ))}
            </div>

            {activeTab === 'qr' ? (
              <div className="space-y-3">
                <Button className="h-12 w-full" onClick={() => { setScanError(null); setScanOpen(true) }}>
                  <QrCode className="h-4 w-4 mr-2" />
                  QR 스캔하기
                </Button>
                {scanError && (
                  <p className="text-center text-sm text-rose-500">{scanError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="h-12 pl-9"
                    placeholder="이름으로 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {filtered.map((p) => (
                    <button
                      key={p.user.id}
                      type="button"
                      onClick={() => handleSelectRecipient(p)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                        <UserRound className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{p.user.realName}</p>
                        <p className="text-xs text-gray-400">{p.balance} 달란트 보유</p>
                      </div>
                    </button>
                  ))}
                  {filtered.length === 0 && search && (
                    <p className="py-4 text-center text-sm text-gray-400">검색 결과가 없어요</p>
                  )}
                  {participants.length === 0 && !search && (
                    <p className="py-4 text-center text-sm text-gray-400">참가자를 불러오는 중...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: 금액 입력 */}
        {step === 'amount' && recipient && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                <UserRound className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">받는 사람</p>
                <p className="text-sm font-semibold text-gray-800">{recipient.user.realName}</p>
              </div>
            </div>
            <Input
              className="h-12 text-center text-lg font-bold"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="전송할 금액 입력"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              className="h-12 w-full"
              onClick={handleAmountNext}
              disabled={!amount || parseInt(amount, 10) < 1}
            >
              다음
            </Button>
          </div>
        )}

        {/* Step 3: 전송 확인 */}
        {step === 'confirm' && recipient && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-gray-50 p-6 text-center space-y-2">
              <p className="text-sm text-gray-500">아래 내용으로 전송할까요?</p>
              <p className="text-xl font-bold text-gray-900">{recipient.user.realName}에게</p>
              <p className="text-3xl font-bold text-emerald-500 tabular-nums">
                {parseInt(amount, 10)} 달란트
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-12 flex-1"
                onClick={() => setStep('amount')}
                disabled={isPending}
              >
                취소
              </Button>
              <Button
                className="h-12 flex-1"
                onClick={handleConfirm}
                disabled={isPending}
              >
                {isPending ? '전송 중…' : '전송'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
