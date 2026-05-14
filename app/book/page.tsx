'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const CATEGORY_LABELS: Record<string, string> = {
  childhood: '어린 시절',
  family: '결혼과 가족',
  life: '살아온 시간들',
  daily: '요즘 일상',
}

export default function BookPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [grouped, setGrouped] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data } = await supabase
      .from('sessions')
      .select('*, messages(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setSessions(data)
      const g: Record<string, any[]> = {}
      data.forEach(s => {
        const cat = s.category || 'life'
        if (!g[cat]) g[cat] = []
        g[cat].push(s)
      })
      setGrouped(g)
    }
    setLoading(false)
  }

  const totalCount = sessions.length

  return (
    <main className="min-h-screen px-5 pt-12 pb-24 page-enter"
      style={{ background: 'linear-gradient(160deg, #faf8f3 0%, #f0ebe0 100%)' }}>

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.push('/home')}
          className="w-10 h-10 rounded-full hover:bg-cream-100 flex items-center justify-center
                     transition-all text-stone-600 text-xl">
          ←
        </button>
        <div>
          <h1 className="font-serif text-2xl text-stone-800">나의 이야기 책</h1>
          <p className="text-stone-warm text-sm">총 {totalCount}개의 이야기</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-stone-400 font-serif text-lg">불러오는 중...</div>
      ) : totalCount === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-4">📖</p>
          <p className="font-serif text-xl text-stone-700 mb-2">아직 이야기가 없어요</p>
          <p className="text-stone-400 text-base mb-6">첫 이야기를 시작해볼까요?</p>
          <button onClick={() => router.push('/home')} className="btn-primary">
            이야기 시작하기
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(CATEGORY_LABELS).map(([catId, catLabel]) => {
            const catSessions = grouped[catId] || []
            if (catSessions.length === 0) return null

            const MAX = 5
            const progress = Math.min(catSessions.length / MAX, 1)

            return (
              <div key={catId} className="card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-serif text-xl text-stone-800">{catLabel}</h2>
                  <span className="text-stone-400 text-sm">{catSessions.length}개</span>
                </div>

                {/* 진행 바 */}
                <div className="h-2 bg-cream-200 rounded-full mb-4 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progress * 100}%`,
                      background: 'linear-gradient(90deg, #8aab8a, #6b8f6b)'
                    }} />
                </div>

                {/* 세션 목록 */}
                <div className="space-y-2">
                  {catSessions.slice(0, 3).map((session) => (
                    <button
                      key={session.id}
                      onClick={() => router.push(`/chat?session=${session.id}`)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-cream-50
                                 hover:bg-cream-100 border border-cream-200 transition-all">
                      <p className="text-stone-700 text-base font-medium">{session.title}</p>
                      <p className="text-stone-400 text-sm mt-0.5">
                        {new Date(session.created_at).toLocaleDateString('ko-KR', {
                          month: 'long', day: 'numeric'
                        })}
                      </p>
                    </button>
                  ))}
                  {catSessions.length > 3 && (
                    <p className="text-sage-500 text-sm text-center py-1">
                      +{catSessions.length - 3}개 더 있어요
                    </p>
                  )}
                </div>
              </div>
            )
          })}

          {/* PDF 내보내기 */}
          <div className="card text-center border-dashed border-sage-300">
            <p className="text-3xl mb-3">📥</p>
            <p className="font-serif text-lg text-stone-700 mb-1">책으로 만들기</p>
            <p className="text-stone-400 text-sm mb-4">이야기를 PDF로 내보내 소중한 사람에게 선물하세요</p>
            <button className="btn-secondary w-full">준비 중이에요</button>
          </div>
        </div>
      )}

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream-200
                      flex justify-around py-3 px-4">
        {[
          { icon: '🏠', label: '홈', path: '/home' },
          { icon: '💬', label: '대화', path: '/chat' },
          { icon: '📖', label: '이야기 책', path: '/book', active: true },
          { icon: '🖼️', label: '갤러리', path: '/gallery' },
        ].map((item) => (
          <button key={item.path} onClick={() => router.push(item.path)}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all
              ${item.active ? 'text-sage-600' : 'text-stone-400 hover:text-stone-600'}`}>
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </nav>
    </main>
  )
}
