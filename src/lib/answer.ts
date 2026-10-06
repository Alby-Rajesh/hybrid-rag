import type { AnswerResult, Turn } from '@/types'
import { chatModel, groq } from './groq'
import { formatContext, hybridSearch } from './retrieve'

export const HISTORY_TURNS = 3
const MAX_TURN_CHARS = 2000

const NOT_FOUND = `I couldn't find that in the uploaded documents.`
const EMPTY_LIBRARY = `The library is empty. Add a document in the Library panel, then ask again.`

const SYSTEM_PROMPT = `You answer questions using only the numbered passages provided with the latest question.
Earlier turns of the conversation are included so you can resolve follow-ups such as "and what about the second one?".
Citation numbers in earlier answers refer to earlier passages; cite only from the current passages, inline as [1] or [2][3].
If the passages do not contain the answer, reply exactly: ${NOT_FOUND}
Weigh the evidence before answering, then reply with a concise answer in plain text.`

const REWRITE_PROMPT = `Rewrite the user's latest question as one standalone search query, resolving pronouns and references using the conversation.
If it is already standalone, return it unchanged. Reply with the query only, with no quotes or explanation.`

const clip = (text: string) => text.slice(0, MAX_TURN_CHARS)

/** Keeps only the most recent turns, so the prompt stays small however long the chat gets. */
export const recentTurns = (history: Turn[]) =>
  history.slice(-HISTORY_TURNS).map((t) => ({ question: clip(t.question), answer: clip(t.answer) }))

const asMessages = (history: Turn[]) =>
  history.flatMap((t) => [
    { role: 'user' as const, content: t.question },
    { role: 'assistant' as const, content: t.answer },
  ])

/** A follow-up like "what about his education?" retrieves badly on its own, so expand it first. */
async function standaloneQuery(question: string, history: Turn[]) {
  if (!history.length) return question
  try {
    const completion = await groq().chat.completions.create({
      model: chatModel(),
      temperature: 0,
      messages: [
        { role: 'system', content: REWRITE_PROMPT },
        ...asMessages(history),
        { role: 'user', content: `Latest question: ${question}` },
      ],
    })
    const rewritten = completion.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '')
    return rewritten && rewritten.length <= 400 ? rewritten : question
  } catch {
    return question
  }
}

export async function answer(question: string, history: Turn[] = []): Promise<AnswerResult> {
  const turns = recentTurns(history)
  const started = Date.now()
  const searchQuery = await standaloneQuery(question, turns)
  const sources = await hybridSearch(searchQuery)
  const retrieved = Date.now()

  if (!sources.length) {
    return {
      answer: EMPTY_LIBRARY,
      sources,
      searchQuery,
      emptyLibrary: true,
      timing: { retrievalMs: retrieved - started, llmMs: 0 },
    }
  }

  const completion = await groq().chat.completions.create({
    model: chatModel(),
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...asMessages(turns),
      { role: 'user', content: `Passages:\n${formatContext(sources)}\n\nQuestion: ${question}` },
    ],
  })

  return {
    answer: completion.choices[0]?.message?.content?.trim() || NOT_FOUND,
    sources,
    searchQuery,
    timing: { retrievalMs: retrieved - started, llmMs: Date.now() - retrieved },
  }
}
