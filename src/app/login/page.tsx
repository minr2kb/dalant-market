import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-10">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500">
            <span className="text-2xl font-bold text-white">D</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Dalant Market</h1>
          <p className="text-sm text-gray-500">오프라인 모임 미션 인증 포인트 마켓</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/onboarding"
            className="flex w-full items-center justify-center gap-3 rounded-full bg-[#FEE500] px-6 py-3.5 font-medium text-[#3C1E1E] transition-opacity hover:opacity-90"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 2C5.582 2 2 4.686 2 8c0 2.13 1.338 4.002 3.352 5.126L4.6 16.23a.25.25 0 0 0 .37.27l3.74-2.48A9.19 9.19 0 0 0 10 14c4.418 0 8-2.686 8-6s-3.582-6-8-6z"
                fill="#3C1E1E"
              />
            </svg>
            카카오로 시작하기
          </Link>
          <p className="text-center text-xs text-gray-400">
            로그인 시 서비스 이용약관에 동의하는 것으로 간주됩니다
          </p>
        </div>
      </div>
    </div>
  )
}
