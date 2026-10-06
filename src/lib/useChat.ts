'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { postJson } from '@/lib/client'
import type { AnswerResult, Turn } from '@/types'

export type Message = {
  id: string
  question: string
  result?: AnswerResult
  error?: string
}

const STORAGE_KEY = 'hybrid-rag.chat.v1'
const KEEP_MESSAGES = 40
/** How many completed exchanges are sent back as context with each new question. */
export const CONTEXT_TURNS = 3

function load(): Message[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function save(messages: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.filter((m) => m.result).slice(-KEEP_MESSAGES)))
  } catch {
    // Storage can be unavailable (private mode); the chat still works for this visit.
  }
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [busy, setBusy] = useState(false)
  const ready = useRef(false)

  useEffect(() => {
    setMessages(load())
    ready.current = true
  }, [])

  useEffect(() => {
    if (ready.current) save(messages)
  }, [messages])

  const ask = useCallback(
    async (question: string) => {
      if (busy) return
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const history: Turn[] = messages
        .filter((m) => m.result && !m.result.emptyLibrary)
        .slice(-CONTEXT_TURNS)
        .map((m) => ({ question: m.question, answer: m.result!.answer }))

      setMessages((prev) => [...prev, { id, question }])
      setBusy(true)
      try {
        const result = await postJson<AnswerResult>('/api/chat', { question, history })
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, result } : m)))
      } catch (err) {
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, error: (err as Error).message } : m)))
      } finally {
        setBusy(false)
      }
    },
    [busy, messages]
  )

  const clear = useCallback(() => setMessages([]), [])

  return { messages, busy, ask, clear }
}
