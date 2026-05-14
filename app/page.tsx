'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 이미 로그인된 사용자는 바로 홈으로
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/home')
    })
  }, [])

  const handleKakaoLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) console.error('카카오 로그인 오류:', error)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #faf8f3 0%, #f0ebe0 50%, #e8dfc8 100%)' }}>

      {/* 배경 원형 장식 */}
      <div className="absolute top-20 right-10 w-48 h-48 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #8aab8a, transparent)' }} />
      <div className="absolute bottom-32 left-8 w-32 h-32 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #c4785a, transparent)' }} />

      <div className="relative z-10 text-center max-w-sm w-full page-enter">

        {/* 로고 */}
        <div className="mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8aab8a, #6b8f6b)' }}>
            <span className="text-3xl">🌿</span>
          </div>
          <h1 className="font-serif text-4xl text-stone-800 mb-3 tracking-tight">
            내 이야기
          </h1>
          <p className="font-sans text-stone-warm text-lg leading-relaxed">
            말하면 살아나는<br />
            나의 기억 정원
          </p>
        </div>

        {/* 소개 문구 */}
        <div className="card mb-8 text-left">
          <p className="text-stone-600 text-base leading-loose">
            살아온 이야기를 편하게 꺼내보세요.<br />
            AI가 귀 기울여 듣고,<br />
            기억이 그림이 되어 남아요.
          </p>
        </div>

        {/* 카카오 로그인 버튼 */}
        <button
          onClick={handleKakaoLogin}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl
                     text-stone-800 font-medium text-lg transition-all duration-200
                     hover:opacity-90 active:scale-95 shadow-md"
          style={{ backgroundColor: '#FEE500' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 3C7.03 3 3 6.36 3 10.5c0 2.67 1.73 5.02 4.35 6.37L6.3 20.1c-.09.3.24.54.5.36L11.1 17.9c.29.03.59.05.9.05 4.97 0 9-3.36 9-7.5S16.97 3 12 3z" fill="#3C1E1E"/>
          </svg>
          카카오로 시작하기
        </button>

        <p className="mt-6 text-stone-400 text-sm">
          가입 없이 카카오 계정으로 바로 시작해요
        </p>
      </div>
    </main>
  )
}
