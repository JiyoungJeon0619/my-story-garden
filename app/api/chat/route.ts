import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const SYSTEM_PROMPT = `당신은 70대 한국 어르신의 인생 이야기를 들어드리는 따뜻한 AI 친구입니다.

당신의 역할과 태도:
- 살갑지만 예의 있는, 마치 잘 교육받은 며느리나 손녀 같은 톤으로 말합니다
- 절대 평가하거나 조언하지 않습니다. 오직 듣고, 공감하고, 더 이야기하고 싶게 만듭니다
- 상대방이 말한 구체적인 단어(이름, 장소, 음식 등)를 다시 활용해 친근감을 줍니다
- 한 번에 하나의 질문만 합니다. 여러 질문을 한꺼번에 하지 않습니다
- 응답은 짧고 따뜻하게. 3-4문장을 넘기지 않습니다
- 존댓말을 항상 사용합니다 (~요, ~세요 형태)
- 이모지는 😊 🌸 ✨ 정도만, 1개씩만 자연스럽게 사용합니다

대화 패턴:
1. 공감 표현 → 구체적인 부분 언급 → 다음 질문
2. 예: "신혼 때 된장찌개 이야기, 정말 생생하게 느껴져요. 그때 남편분 표정이 눈에 선하네요. 그래도 끝까지 다 드셨나요? 😊"

절대 하지 말 것:
- "좋은 말씀이에요", "훌륭하시네요" 같은 평가성 칭찬
- 긴 설명이나 정보 제공
- 여러 질문 동시에 하기
- 어색한 번역투 표현`

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messages, sessionId, userProfile } = await req.json()

    // 사용자 프로필 컨텍스트 추가
    const birthDecade = userProfile?.birth_decade
    const currentYear = new Date().getFullYear()
    const approxAge = birthDecade
      ? currentYear - parseInt(birthDecade.replace('s', '')) + 5
      : null

    const profileContext = userProfile
      ? `\n\n사용자 정보:
- 닉네임: "${userProfile.nickname}"
- 주요 이야기 카테고리: "${userProfile.story_category}"
${birthDecade ? `- 출생 연대: ${birthDecade} (현재 약 ${approxAge}세)` : ''}
${birthDecade ? `- 시대 배경: ${birthDecade.replace('s','')}년대생이므로 질문 시 그 시대 맥락(당시 학교생활, 문화, 사회상)을 자연스럽게 녹여주세요.` : ''}
${userProfile.interests?.length > 0 ? `- 파악된 관심사: ${userProfile.interests.join(', ')}` : ''}`
      : ''

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 300,
      system: SYSTEM_PROMPT + profileContext,
      messages: messages,
    })

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    // 메시지 DB 저장
    if (sessionId) {
      const lastUserMessage = messages[messages.length - 1]

      // 사용자 메시지 저장
      if (lastUserMessage.role === 'user') {
        await supabase.from('messages').insert({
          session_id: sessionId,
          user_id: user.id,
          role: 'user',
          content: lastUserMessage.content,
        })
      }

      // AI 메시지 저장
      await supabase.from('messages').insert({
        session_id: sessionId,
        user_id: user.id,
        role: 'assistant',
        content: assistantMessage,
      })

      // 세션 updated_at 갱신
      await supabase.from('sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId)
    }

    return NextResponse.json({ message: assistantMessage })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
