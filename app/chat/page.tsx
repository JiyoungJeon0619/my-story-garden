'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<{ url: string; caption: string } | null>(null)
  const [showImagePrompt, setShowImagePrompt] = useState(false)
  const [isFreeMode, setIsFreeMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    initChat()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    // 메시지가 4개 이상이면 이미지 생성 옵션 보여주기
    if (messages.length >= 4 && messages.filter(m => m.role === 'user').length >= 2) {
      setShowImagePrompt(true)
    }
  }, [messages])

  const initChat = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: prof } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)

    const mode = searchParams.get('mode')
    const question = searchParams.get('question')
    const existingSessionId = searchParams.get('session')
    setIsFreeMode(mode === 'free')

    if (existingSessionId) {
      // 기존 세션 이어가기
      setSessionId(existingSessionId)
      const { data: msgs } = await supabase
        .from('messages')
        .select('role, content')
        .eq('session_id', existingSessionId)
        .order('created_at')
      if (msgs) setMessages(msgs as Message[])
    } else {
      // 새 세션 생성
      const { data: session } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          category: prof?.story_category || 'life',
          title: question ? question.slice(0, 20) + '...' : '새 이야기',
        })
        .select()
        .single()

      if (session) setSessionId(session.id)

      // 첫 메시지: 오늘의 질문 or 자유 시작
      const firstMessage: Message = {
        role: 'assistant',
        content: mode === 'free'
          ? `네, 들을게요 😊\n\n오늘 어떤 이야기를 하고 싶으세요?`
          : question
            ? question
            : '안녕하세요! 오늘은 어떤 이야기를 나눠볼까요? 😊',
      }
      setMessages([firstMessage])
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          sessionId,
          userProfile: profile,
        }),
      })

      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const generateImage = async () => {
    setGeneratingImage(true)
    setShowImagePrompt(false)

    const conversationText = messages
      .map(m => `${m.role === 'user' ? '나' : 'AI'}: ${m.content}`)
      .join('\n')

    try {
      const res = await fetch('/api/image-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationText, sessionId }),
      })
      const data = await res.json()
      if (data.imageUrl) {
        setGeneratedImage({ url: data.imageUrl, caption: data.caption })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen"
      style={{ background: 'linear-gradient(160deg, #faf8f3 0%, #f0ebe0 100%)' }}>

      {/* 헤더 */}
      <header className="flex items-center gap-3 px-5 py-4 bg-white/70 backdrop-blur-sm
                         border-b border-cream-200">
        <button onClick={() => router.push('/home')}
          className="w-10 h-10 rounded-full hover:bg-cream-100 flex items-center justify-center
                     transition-all text-stone-600 text-xl">
          ←
        </button>
        <div>
          <h2 className="font-serif text-lg text-stone-800">이야기 나누기</h2>
          <p className="text-stone-400 text-sm">언제든 다른 이야기로 넘어가도 괜찮아요</p>
        </div>
      </header>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i}
            className={`flex message-enter ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-9 h-9 rounded-full flex-shrink-0 mr-3 mt-1
                              flex items-center justify-center text-base"
                style={{ background: 'linear-gradient(135deg, #8aab8a, #6b8f6b)' }}>
                🌿
              </div>
            )}
            <div className={`max-w-[78%] px-5 py-4 rounded-3xl text-base leading-relaxed whitespace-pre-wrap
              ${msg.role === 'user'
                ? 'bg-sage-500 text-white rounded-tr-sm'
                : 'bg-white text-stone-800 shadow-sm rounded-tl-sm border border-cream-100'
              }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* 로딩 */}
        {loading && (
          <div className="flex items-center gap-3 message-enter">
            <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-base"
              style={{ background: 'linear-gradient(135deg, #8aab8a, #6b8f6b)' }}>
              🌿
            </div>
            <div className="bg-white px-5 py-4 rounded-3xl rounded-tl-sm shadow-sm border border-cream-100">
              <div className="dot-bounce flex gap-1">
                <span className="w-2 h-2 rounded-full bg-sage-400 inline-block" />
                <span className="w-2 h-2 rounded-full bg-sage-400 inline-block" />
                <span className="w-2 h-2 rounded-full bg-sage-400 inline-block" />
              </div>
            </div>
          </div>
        )}

        {/* 이미지 생성 유도 */}
        {showImagePrompt && !generatedImage && (
          <div className="flex justify-center message-enter">
            <div className="card text-center max-w-xs">
              <p className="text-stone-600 text-base mb-3">
                이야기가 쌓였네요 🌸<br />
                지금까지의 기억을 그림으로 만들어볼까요?
              </p>
              <button onClick={generateImage}
                className="btn-primary w-full">
                🖼️ 기억 그림 만들기
              </button>
              <button onClick={() => setShowImagePrompt(false)}
                className="mt-2 text-stone-400 text-sm underline">
                괜찮아요, 계속 이야기할게요
              </button>
            </div>
          </div>
        )}

        {/* 이미지 생성 중 */}
        {generatingImage && (
          <div className="flex justify-center message-enter">
            <div className="card text-center max-w-xs">
              <div className="animate-pulse-soft text-4xl mb-3">🎨</div>
              <p className="text-stone-600 text-base">기억을 그림으로 담고 있어요...</p>
            </div>
          </div>
        )}

        {/* 생성된 이미지 */}
        {generatedImage && (
          <div className="flex justify-center message-enter">
            <div className="card max-w-xs">
              <div className="rounded-2xl overflow-hidden mb-3">
                <Image src={generatedImage.url} alt={generatedImage.caption}
                  width={400} height={400} className="w-full object-cover" />
              </div>
              <p className="font-serif text-center text-stone-700 text-lg">
                {generatedImage.caption}
              </p>
              <button onClick={() => router.push('/gallery')}
                className="mt-3 text-sage-500 text-sm underline w-full text-center">
                갤러리에서 보기 →
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <div className="px-4 py-4 bg-white/80 backdrop-blur-sm border-t border-cream-200">
        <div className="flex gap-3 items-end">
          {/* 다른 이야기 버튼 */}
          <button
            onClick={() => router.push('/home')}
            className="w-11 h-11 flex-shrink-0 rounded-full bg-cream-100 border border-cream-200
                       flex items-center justify-center text-stone-500 hover:bg-cream-200
                       transition-all text-sm"
            title="다른 이야기로">
            💬
          </button>

          <div className="flex-1 flex items-end gap-2 bg-cream-100 rounded-2xl px-4 py-3
                          border border-cream-200 focus-within:border-sage-400 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="이야기를 써주세요..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-stone-800
                         text-base leading-relaxed max-h-32 font-sans"
              style={{ minHeight: '28px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center
                          transition-all text-base
                ${input.trim() && !loading
                  ? 'bg-sage-500 text-white hover:bg-sage-600 active:scale-95'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}>
              ↑
            </button>
          </div>
        </div>

        <p className="text-center text-stone-300 text-xs mt-2">
          다른 이야기를 하고 싶으면 💬 버튼을 눌러주세요
        </p>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-warm font-serif text-lg">잠시만요...</p>
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}
