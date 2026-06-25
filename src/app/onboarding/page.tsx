'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft } from 'lucide-react'

type Step = 1 | 2 | 3

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | null>(null)

  function handleNext() {
    if (step < 3) setStep((s) => (s + 1) as Step)
    else router.push('/markets')
  }

  const canProceed =
    (step === 1 && name.trim().length > 0) ||
    (step === 2 && birthDate.length === 10) ||
    (step === 3 && gender !== null)

  return (
    <div className="flex min-h-svh flex-col bg-white px-6 pt-14">
      <div className="mb-8 space-y-4">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="flex items-center gap-1 text-sm text-gray-500"
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </button>
        )}
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-emerald-500' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400">{step} / 3</p>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">본명을 입력해주세요</h2>
            <p className="text-sm text-gray-500">실명으로 등록해야 미션 인증에 이름이 표시돼요</p>
          </div>
          <Input
            placeholder="홍길동"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border-gray-200 py-3 text-base"
            autoFocus
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">생일을 입력해주세요</h2>
            <p className="text-sm text-gray-500">생일월 미션 인증에 활용돼요</p>
          </div>
          <Input
            placeholder="YYYY-MM-DD"
            value={birthDate}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9-]/g, '')
              setBirthDate(v)
            }}
            maxLength={10}
            className="rounded-xl border-gray-200 py-3 text-base"
            autoFocus
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">성별을 선택해주세요</h2>
            <p className="text-sm text-gray-500">미션 매칭에 활용돼요</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['male', 'female'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`rounded-2xl border-2 py-6 text-base font-medium transition-colors ${
                  gender === g
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-100 bg-white text-gray-600'
                }`}
              >
                {g === 'male' ? '남자' : '여자'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pb-10 pt-8">
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="w-full rounded-full bg-emerald-500 py-3 text-base font-medium text-white hover:bg-emerald-600 disabled:opacity-40"
        >
          {step === 3 ? '완료하고 시작하기' : '다음'}
        </Button>
      </div>
    </div>
  )
}
