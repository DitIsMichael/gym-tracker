import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Je bent een persoonlijke fitnesscoach. Je geeft advies over training, oefeningen, herstel en voeding. Houd antwoorden beknopt en praktisch. Antwoord altijd in het Nederlands.',
      },
      ...messages,
    ],
    max_tokens: 500,
  })

  return NextResponse.json({ reply: response.choices[0].message.content })
}
