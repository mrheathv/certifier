import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

interface QAPair {
  question: string
  answer: string
}

export async function POST(request: NextRequest) {
  try {
    const { name, topic, answers } = await request.json() as {
      name: string
      topic: string
      answers: QAPair[]
    }

    if (!name || !topic || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Name, topic, and answers are required' }, { status: 400 })
    }

    const qaText = answers
      .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
      .join('\n\n')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Write a short, fun, and personalized certification statement for ${name} who just completed a quiz on "${topic}".

Here were their Q&A responses:
${qaText}

Requirements:
- Write exactly 2-3 sentences
- Always grant the certificate (this is a fun app, not a serious test)
- Be warm, celebratory, and personalized — reference something specific from their answers
- Sound like an official but playful certification
- Do NOT include the person's name (it will be added separately)
- Do NOT include phrases like "This certifies that" (that will be added separately)

Return ONLY the 2-3 sentence statement, nothing else.`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    return NextResponse.json({ statement: content.text.trim() })
  } catch (error) {
    console.error('Error generating certificate:', error)
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    )
  }
}
