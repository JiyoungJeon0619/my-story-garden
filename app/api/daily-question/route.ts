import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const { category, birthDecade, nickname } = await req.json()

    const categoryMap: Record<string, string> = {
      childhood: '어린 시절 기억 (고향, 학교, 친구)',
      family: '결혼과 가족 이야기',
      life: '살아온 시간들 (선택, 도전, 성취)',
      daily: '요즘 일상과 감정',
    }

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `${nickname}님은 ${birthDecade}년대생이고 "${categoryMap[category] || '인생 이야기'}" 에 관한 이야기를 나누고 싶어해요.

오늘 대화를 자연스럽게 시작할 수 있는 따뜻한 질문 하나만 만들어주세요.

규칙:
- 한국어로
- 한 문장
- 너무 무겁지 않고 편하게 답할 수 있는 질문
- 구체적인 기억을 떠올릴 수 있는 질문
- 물음표로 끝내기
- 질문만 출력 (설명 없이)

예시:
"어릴 때 방과 후에 주로 어디서 시간을 보내셨어요?"
"결혼 첫 해에 가장 기억에 남는 순간이 있으세요?"`
      }]
    })

    const question = response.content[0].type === 'text'
      ? response.content[0].text.trim().replace(/^["']|["']$/g, '')
      : '오늘 어떤 이야기를 나눠볼까요?'

    return NextResponse.json({ question })
  } catch (error) {
    console.error('Daily question error:', error)
    return NextResponse.json({ question: '오늘 어떤 이야기를 나눠볼까요?' })
  }
}