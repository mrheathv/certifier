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
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are grading a quiz on "${topic}". Evaluate each answer and return a JSON object.

${qaText}

For each question, decide if the answer is correct, partially correct, or incorrect. Be generous — give credit for answers that show genuine understanding even if imprecise. Award 1 point for correct/mostly correct, 0 for clearly wrong or blank.

Then, if the total score is 3 or more out of ${answers.length}, write a short 2-3 sentence certification statement for ${name}.

Return ONLY valid JSON in exactly this format, no markdown, no explanation:
{
  "scores": [
    { "question": "...", "answer": "...", "correct": true, "feedback": "one short sentence" },
    ...
  ],
  "totalScore": 4,
  "passed": true,
  "statement": "2-3 sentence statement if passed, empty string if failed"
}

Requirements for the statement (only if passed):
- Be warm, celebratory, and personalized — reference something from their answers
- Do NOT include the person's name (added separately)
- Do NOT start with "This certifies that"`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const text = content.text.trim()
    let result
    try {
      result = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) result = JSON.parse(match[0])
      else throw new Error('Could not parse response as JSON')
    }

    return NextResponse.json({
      scores: result.scores,
      totalScore: result.totalScore,
      passed: result.passed,
      statement: result.statement ?? '',
    })
  } catch (error) {
    console.error('Error generating certificate:', error)
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    )
  }
}
