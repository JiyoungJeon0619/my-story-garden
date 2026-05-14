import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { conversationText, sessionId } = await req.json()

    // 1. Claude로 이미지 프롬프트 생성
    const promptResponse = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `다음 대화에서 가장 인상적인 장면을 수채화 스타일의 DALL-E 이미지 프롬프트로 만들어주세요.
        
대화 내용:
${conversationText}

규칙:
- 영어로 작성
- 50단어 이내
- "watercolor illustration, warm vintage tones, Korean 1960s-1980s style, soft and nostalgic" 를 항상 포함
- 사람 얼굴은 묘사하지 않기
- 장면, 공간, 사물 위주로 묘사

프롬프트만 출력하세요.`
      }]
    })

    const imagePrompt = promptResponse.content[0].type === 'text'
      ? promptResponse.content[0].text.trim()
      : 'A warm Korean home scene, watercolor illustration, warm vintage tones, soft and nostalgic'

    // 2. DALL-E로 이미지 생성
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    })

    const imageUrl = imageResponse.data[0]?.url
    if (!imageUrl) throw new Error('Image generation failed')

    // 3. 한국어 캡션 생성
    const captionResponse = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: `이 대화 내용을 보고, 생성된 그림의 짧은 감성적 제목을 한국어로 만들어주세요 (15자 이내):
${conversationText}
제목만 출력하세요.`
      }]
    })

    const caption = captionResponse.content[0].type === 'text'
      ? captionResponse.content[0].text.trim()
      : '소중한 기억'

    // 4. DB에 저장
    if (sessionId) {
      await supabase.from('story_images').insert({
        session_id: sessionId,
        user_id: user.id,
        image_url: imageUrl,
        prompt: imagePrompt,
        caption: caption,
      })
    }

    return NextResponse.json({ imageUrl, caption, prompt: imagePrompt })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
  }
}
