import type { AnswerResult } from '@/types'
import { chatModel, groq } from './groq'
import { formatContext, hybridSearch } from './retrieve'

const NOT_FOUND = `I couldn't find that in the uploaded documents.`

const SYSTEM_PROMPT = `You answer questions using only the numbered passages provided.
Cite passages inline as [1] or [2][3].
If the passages do not contain the answer, reply exactly: ${NOT_FOUND}
Weigh the evidence before answering, then reply with a concise answer in plain text.`

export async function answer(question: string): Promise<AnswerResult> {
  const started = Date.now()
  const sources = await hybridSearch(question)
  const retrieved = Date.now()

  const completion = await groq().chat.completions.create({
    model: chatModel(),
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Passages:\n${formatContext(sources)}\n\nQuestion: ${question}` },
    ],
  })

  return {
    answer: completion.choices[0]?.message?.content?.trim() || NOT_FOUND,
    sources,
    timing: { retrievalMs: retrieved - started, llmMs: Date.now() - retrieved },
  }
}
