'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(
        window.location.search
      )

      if (error || !session) {
        router.push('/')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, story_category')
        .eq('id', session.user.id)
        .single()

      if (!profile) {
        await supabase.from('profiles').insert({
          id: session.user.id,
          kakao_id: session.user.user_metadata?.provider_id,
          nickname: session.user.user_metadata?.name ||
                    session.user.user_metadata?.full_name || '이야기꾼',
          avatar_url: session.user.user_metadata?.avatar_url,
        })
        router.push('/onboarding')
      } else if (!profile.story_category) {
        router.push('/onboarding')
      } else {
        router.push('/home')
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #8aab8a, #6b8f6b)' }}>
          <span className="text-2xl">🌿</span>
        </div>
        <p className="text-stone-500 text-lg font-serif">잠시만요...</p>
      </div>
    </div>
  )
}