import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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
        content: `다음 대화에서 가장 인상적인 장면을 수채화 스타일의 이미지 프롬프트로 만들어주세요.
        
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

    // 2. OpenAI API 직접 호출
    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: imagePrompt,
        size: '1024x1024',
        quality: 'medium',
        n: 1,
      }),
    })

    const openaiData = await openaiResponse.json()

    if (!openaiResponse.ok) {
      console.error('OpenAI error:', openaiData)
      throw new Error(openaiData.error?.message || 'Image generation failed')
    }

    // gpt-image-1은 base64로 반환
    const imageBase64 = openaiData.data?.[0]?.b64_json
    const imageUrlRaw = openaiData.data?.[0]?.url

    if (!imageBase64 && !imageUrlRaw) throw new Error('No image returned')

    const finalImageUrl = imageUrlRaw || `data:image/png;base64,${imageBase64}`

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

        // 4. base64를 Supabase Storage에 업로드
    const imageBuffer = Buffer.from(imageBase64 || '', 'base64')
    const fileName = `${user.id}/${Date.now()}.png`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('story-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      })

    let storedImageUrl = finalImageUrl

    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage
        .from('story-images')
        .getPublicUrl(fileName)
      storedImageUrl = urlData.publicUrl
    }

    // 5. DB에 저장
    if (sessionId) {
      await supabase.from('story_images').insert({
        session_id: sessionId,
        user_id: user.id,
        image_url: storedImageUrl,
        prompt: imagePrompt,
        caption: caption,
      })
    }

    return NextResponse.json({ imageUrl: finalImageUrl, caption, prompt: imagePrompt })
    return NextResponse.json({ imageUrl: finalImageUrl, caption, prompt: imagePrompt })

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
  }
}