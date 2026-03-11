import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { messages, gymContext } = await req.json()

  const systemPrompt = [
    'Je bent een persoonlijke fitnesscoach. Je geeft advies over training, oefeningen, herstel en voeding. Houd antwoorden beknopt en praktisch. Antwoord altijd in het Nederlands.',
    gymContext ? `\n\nHieronder staat de actuele trainingsdata van de gebruiker. Gebruik deze informatie als context bij het beantwoorden van vragen.\n\n${gymContext}` : '',
  ].join('')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: 600,
  })

  return NextResponse.json({ reply: response.choices[0].message.content })
}
