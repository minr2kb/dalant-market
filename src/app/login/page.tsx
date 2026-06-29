'use client'

import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  async function handleKakaoLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex min-h-svh flex-col overflow-hidden bg-white">
      {/* 로고 */}
      <div className="flex flex-1 items-center justify-center">
        <div className="relative h-48 w-full">
          <Image
            src="/logo.png"
            alt="달란트 마켓"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* 로그인 */}
      <div className="space-y-3 px-8 pb-16">
        <p className="text-center text-sm leading-relaxed text-gray-400 pb-2">
          오프라인 모임을 위한 미션 인증 달란트 결제 서비스
        </p>
        <button
          type="button"
          onClick={handleKakaoLogin}
          className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[#FEE500] font-semibold text-[#3C1E1E] transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10 2C5.582 2 2 4.686 2 8c0 2.13 1.338 4.002 3.352 5.126L4.6 16.23a.25.25 0 0 0 .37.27l3.74-2.48A9.19 9.19 0 0 0 10 14c4.418 0 8-2.686 8-6s-3.582-6-8-6z"
              fill="#3C1E1E"
            />
          </svg>
          카카오로 시작하기
        </button>
        <p className="text-center text-xs text-gray-300">
          로그인 시 서비스 이용약관에 동의합니다
        </p>
      </div>
    </div>
  )
}
