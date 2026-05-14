'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const GREETINGS: Record<string, string> = {
  morning: '좋은 아침이에요',
  afternoon: '안녕하세요',
  evening: '좋은 저녁이에요',
  night: '밤이 깊었네요',
}

const CHANGE_OPTIONS = [
  { id: 'person', label: '요즘 생각나는 사람' },
  { id: 'proud', label: '내가 잘했다고 생각하는 일' },
  { id: 'happy', label: '가장 행복했던 순간' },
  { id: 'custom', label: '직접 말할게요' },
]

export default function HomePage() {
  const [profile, setProfile] = useState<any>(null)
  const [question, setQuestion] = useState<string>('')
  const [greeting, setGreeting] = useState('')
  const [showChangeOptions, setShowChangeOptions] = useState(false)
  const [lastSession, setLastSession] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) setGreeting(GREETINGS.morning)
    else if (hour >= 12 && hour < 18) setGreeting(GREETINGS.afternoon)
    else if (hour >= 18 && hour < 22) setGreeting(GREETINGS.evening)
    else setGreeting(GREETINGS.night)

    loadUserData()
  }, [])

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!prof?.story_category) { router.push('/onboarding'); return }
    setProfile(prof)

    // 오늘의 질문 가져오기
    const { data: questions } = await supabase
      .from('daily_questions')
      .select('question')
      .eq('category', prof.story_category)
      .eq('is_active', true)

    if (questions && questions.length > 0) {
      // 날짜 기반으로 오늘 질문 결정 (매일 바뀜)
      const dayIndex = new Date().getDate() % questions.length
      setQuestion(questions[dayIndex].question)
    }

    // 최근 세션 가져오기
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    setLastSession(session)
  }

  const startNewChat = (customQuestion?: string) => {
    const q = customQuestion || question
    router.push(`/chat?question=${encodeURIComponent(q)}`)
  }

  const handleChangeOption = (optionId: string) => {
    if (optionId === 'custom') {
      router.push('/chat?mode=free')
      return
    }
    const topics: Record<string, string> = {
      person: '요즘 자주 생각나는 사람이 있으세요?',
      proud: '살면서 내가 잘했다고 생각하는 일이 있으세요?',
      happy: '생각만 해도 미소 짓게 되는 행복한 기억이 있으세요?',
    }
    startNewChat(topics[optionId])
    setShowChangeOptions(false)
  }

  return (
    <main className="min-h-screen px-5 pt-12 pb-24 page-enter"
      style={{ background: 'linear-gradient(160deg, #faf8f3 0%, #f0ebe0 100%)' }}>

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-stone-warm text-base">{greeting}</p>
          <h1 className="font-serif text-2xl text-stone-800 mt-1">
            {profile?.nickname || ''}님 ✨
          </h1>
        </div>
        <button
          onClick={() => router.push('/book')}
          className="w-11 h-11 rounded-full bg-white border border-cream-200 
                     flex items-center justify-center text-xl shadow-sm
                     hover:shadow-md transition-all">
          📖
        </button>
      </div>

      {/* 오늘의 질문 카드 */}
      <div className="card mb-4">
        <p className="text-stone-400 text-sm mb-3 font-sans">오늘의 질문</p>

        {!showChangeOptions ? (
          <>
            <p className="font-serif text-xl text-stone-800 leading-relaxed mb-5">
              {question || '잠시만요...'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => startNewChat()}
                className="btn-primary flex-1 text-center">
                이야기 시작하기
              </button>
              <button
                onClick={() => setShowChangeOptions(true)}
                className="btn-secondary px-4 text-sm">
                바꾸기
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 먼저 쉽게 풀어주기 시도 */}
            <div className="bg-sage-400/10 rounded-xl p-4 mb-4">
              <p className="text-sage-600 text-base">
                이 질문이 어려우셨나요? 😊<br />
                어떤 이야기로 넘어갈까요?
              </p>
            </div>
            <div className="space-y-2 mb-3">
              {CHANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleChangeOption(opt.id)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-white border 
                             border-cream-200 hover:border-sage-400 hover:bg-cream-50
                             text-stone-700 text-base transition-all">
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowChangeOptions(false)}
              className="text-stone-400 text-sm underline">
              원래 질문으로 돌아가기
            </button>
          </>
        )}
      </div>

      {/* 내가 먼저 이야기하기 */}
      <button
        onClick={() => router.push('/chat?mode=free')}
        className="w-full text-left px-5 py-4 rounded-2xl border border-dashed 
                   border-sage-400 hover:bg-sage-400/5 transition-all
                   text-sage-600 text-base flex items-center gap-3 mb-6">
        <span className="text-xl">💬</span>
        내가 먼저 이야기할게요 →
      </button>

      {/* 이어가기 */}
      {lastSession && (
        <div className="card">
          <p className="text-stone-400 text-sm mb-3">이어가기</p>
          <p className="font-serif text-lg text-stone-700 mb-3">
            {lastSession.title || '지난 이야기'}
          </p>
          <button
            onClick={() => router.push(`/chat?session=${lastSession.id}`)}
            className="btn-secondary w-full text-center">
            계속 이야기하기
          </button>
        </div>
      )}

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream-200 
                      flex justify-around py-3 px-4">
        {[
          { icon: '🏠', label: '홈', path: '/home', active: true },
          { icon: '💬', label: '대화', path: '/chat', active: false },
          { icon: '📖', label: '이야기 책', path: '/book', active: false },
          { icon: '🖼️', label: '갤러리', path: '/gallery', active: false },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all
              ${item.active ? 'text-sage-600' : 'text-stone-400 hover:text-stone-600'}`}>
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-sans">{item.label}</span>
          </button>
        ))}
      </nav>
    </main>
  )
}
