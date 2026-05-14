'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const CATEGORIES = [
  {
    id: 'childhood',
    emoji: '🌱',
    label: '어린 시절 기억',
    desc: '고향, 학교, 친구들과의 추억',
  },
  {
    id: 'family',
    emoji: '🏡',
    label: '결혼과 가족 이야기',
    desc: '소중한 사람들과 함께한 시간',
  },
  {
    id: 'life',
    emoji: '🌸',
    label: '내가 살아온 시간들',
    desc: '나를 만들어온 선택과 순간들',
  },
  {
    id: 'daily',
    emoji: '☀️',
    label: '요즘 내 일상',
    desc: '지금 이 순간의 생각과 감정',
  },
]

const CURRENT_YEAR = new Date().getFullYear()

export default function OnboardingPage() {
  const [step, setStep] = useState<'birth' | 'category'>('birth')
  const [birthYear, setBirthYear] = useState('')
  const [birthYearError, setBirthYearError] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const validateAndNextStep = () => {
    const year = parseInt(birthYear)
    if (!birthYear || isNaN(year)) {
      setBirthYearError('태어난 연도를 입력해주세요')
      return
    }
    if (year < 1920 || year > CURRENT_YEAR - 10) {
      setBirthYearError('올바른 연도를 입력해주세요')
      return
    }
    setBirthYearError('')
    setStep('category')
  }

  const handleBirthYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
    setBirthYear(val)
    if (birthYearError) setBirthYearError('')
  }

  const handleStart = async () => {
    if (!selected) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    // birth_decade 계산: "1950s" 형식
    const decade = `${Math.floor(parseInt(birthYear) / 10) * 10}s`

    await supabase.from('profiles')
      .update({
        story_category: selected,
        birth_decade: decade,
      })
      .eq('id', user.id)

    router.push('/home')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'linear-gradient(160deg, #faf8f3 0%, #f0ebe0 100%)' }}>

      <div className="w-full max-w-sm page-enter">

        {/* 스텝 인디케이터 */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className={`h-1.5 w-10 rounded-full transition-all duration-300
            ${step === 'birth' ? 'bg-sage-500' : 'bg-sage-500'}`} />
          <div className={`h-1.5 w-10 rounded-full transition-all duration-300
            ${step === 'category' ? 'bg-sage-500' : 'bg-cream-200'}`} />
        </div>

        {/* STEP 1 — 태어난 연도 */}
        {step === 'birth' && (
          <>
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl text-stone-800 mb-3">
                몇 년생이세요?
              </h2>
              <p className="text-stone-warm text-base leading-relaxed">
                이야기에 맞는 질문을 드리기 위해<br />딱 하나만 여쭤볼게요.
              </p>
            </div>

            <div className="mb-3">
              <div className={`flex items-center gap-3 bg-white border-2 rounded-2xl px-5 py-4
                transition-all duration-200
                ${birthYearError ? 'border-red-300' : 'border-cream-200 focus-within:border-sage-400'}`}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={birthYear}
                  onChange={handleBirthYearChange}
                  onKeyDown={e => e.key === 'Enter' && validateAndNextStep()}
                  placeholder="예) 1955"
                  maxLength={4}
                  autoFocus
                  className="flex-1 text-2xl font-serif text-stone-800 bg-transparent outline-none
                             placeholder:text-stone-300 tracking-widest"
                />
                <span className="text-stone-400 text-lg font-sans">년생</span>
              </div>
              {birthYearError && (
                <p className="mt-2 text-red-400 text-sm px-1 font-sans">{birthYearError}</p>
              )}
            </div>

            {/* 미리보기: 나이 계산 */}
            {birthYear.length === 4 && !isNaN(parseInt(birthYear)) && parseInt(birthYear) > 1920 && (
              <p className="text-stone-warm text-sm text-center mb-6 font-sans animate-fade-in">
                올해 {CURRENT_YEAR - parseInt(birthYear)}세이시군요 😊
              </p>
            )}

            <button
              onClick={validateAndNextStep}
              disabled={birthYear.length !== 4}
              className={`w-full py-4 rounded-2xl text-lg font-medium transition-all duration-200
                ${birthYear.length === 4
                  ? 'bg-sage-500 text-white hover:bg-sage-600 active:scale-95 shadow-sm'
                  : 'bg-cream-200 text-stone-400 cursor-not-allowed'
                }`}>
              다음 →
            </button>
          </>
        )}

        {/* STEP 2 — 카테고리 */}
        {step === 'category' && (
          <>
            <div className="text-center mb-8">
              <h2 className="font-serif text-3xl text-stone-800 mb-3">
                어떤 이야기부터<br />시작해볼까요?
              </h2>
              <p className="text-stone-warm text-base">
                하나만 골라주세요.<br />나중에 언제든 바꿀 수 있어요.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelected(cat.id)}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200
                    ${selected === cat.id
                      ? 'border-sage-500 bg-sage-400/10 shadow-sm'
                      : 'border-cream-200 bg-white hover:border-sage-400 hover:bg-cream-50'
                    }`}>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{cat.emoji}</span>
                    <div>
                      <p className="font-medium text-stone-800 text-lg">{cat.label}</p>
                      <p className="text-stone-400 text-sm mt-0.5">{cat.desc}</p>
                    </div>
                    {selected === cat.id && (
                      <div className="ml-auto w-6 h-6 rounded-full bg-sage-500 flex items-center justify-center flex-shrink-0">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('birth')}
                className="btn-secondary px-5">
                ←
              </button>
              <button
                onClick={handleStart}
                disabled={!selected || loading}
                className={`flex-1 py-4 rounded-2xl text-lg font-medium transition-all duration-200
                  ${selected && !loading
                    ? 'bg-sage-500 text-white hover:bg-sage-600 active:scale-95 shadow-sm'
                    : 'bg-cream-200 text-stone-400 cursor-not-allowed'
                  }`}>
                {loading ? '잠시만요...' : '이야기 시작하기 →'}
              </button>
            </div>
          </>
        )}

      </div>
    </main>
  )
}
