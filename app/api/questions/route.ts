import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json()

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate exactly 5 quiz questions about "${topic}". These should be easy-to-medium knowledge questions that a casual learner or enthusiast would know — not overly technical or obscure. Questions should be fun, interesting, and engaging.

Return ONLY a valid JSON array of 5 strings, nothing else. No markdown, no explanation, just the JSON array.

Example format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    // Parse the JSON array from the response
    const text = content.text.trim()
    let questions: string[]

    try {
      questions = JSON.parse(text)
    } catch {
      // Try to extract JSON array if there's surrounding text
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        questions = JSON.parse(match[0])
      } else {
        throw new Error('Could not parse questions as JSON')
      }
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format')
    }

    // Ensure exactly 5 questions
    questions = questions.slice(0, 5)

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error generating questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    )
  }
}
