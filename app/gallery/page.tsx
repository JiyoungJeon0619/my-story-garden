'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'

export default function GalleryPage() {
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data } = await supabase
      .from('story_images')
      .select('*, sessions(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setImages(data)
    setLoading(false)
  }

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
          <h1 className="font-serif text-2xl text-stone-800">기억 갤러리</h1>
          <p className="text-stone-warm text-sm">이야기가 그림이 되었어요</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-stone-400 font-serif">불러오는 중...</div>
      ) : images.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-5xl mb-4">🖼️</p>
          <p className="font-serif text-xl text-stone-700 mb-2">아직 그림이 없어요</p>
          <p className="text-stone-400 text-base mb-6">
            이야기를 나누다 보면<br />기억이 그림이 되어요
          </p>
          <button onClick={() => router.push('/chat')} className="btn-primary">
            이야기 시작하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => setSelected(img)}
              className="group rounded-2xl overflow-hidden bg-white shadow-sm
                         border border-cream-100 hover:shadow-md transition-all">
              <div className="aspect-square relative">
                <Image src={img.image_url} alt={img.caption}
                  fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-3">
                <p className="font-serif text-stone-700 text-sm leading-snug">
                  {img.caption}
                </p>
                <p className="text-stone-400 text-xs mt-1">
                  {new Date(img.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 이미지 상세 모달 */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-5"
          onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="relative aspect-square">
              <Image src={selected.image_url} alt={selected.caption}
                fill className="object-cover" />
            </div>
            <div className="p-5">
              <p className="font-serif text-xl text-stone-800 mb-2">{selected.caption}</p>
              {selected.sessions?.title && (
                <p className="text-stone-400 text-sm mb-4">
                  📖 {selected.sessions.title}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    router.push(`/chat?session=${selected.session_id}`)
                  }}
                  className="btn-secondary flex-1 text-center text-sm">
                  이 이야기 보기
                </button>
                <button onClick={() => setSelected(null)}
                  className="btn-secondary px-4 text-sm">
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream-200
                      flex justify-around py-3 px-4">
        {[
          { icon: '🏠', label: '홈', path: '/home' },
          { icon: '💬', label: '대화', path: '/chat' },
          { icon: '📖', label: '이야기 책', path: '/book' },
          { icon: '🖼️', label: '갤러리', path: '/gallery', active: true },
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
