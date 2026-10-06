'use client'

import { useState } from 'react'
import { AskForm } from '@/components/AskForm'
import { Evidence } from '@/components/Evidence'
import { UploadPanel } from '@/components/UploadPanel'
import { postJson } from '@/lib/client'
import type { AnswerResult } from '@/types'

export default function Home() {
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function ask(question: string) {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      setResult(await postJson<AnswerResult>('/api/chat', { question }))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className='shell'>
      <aside className='stack'>
        <div className='panel'>
          <h1>Ask your documents</h1>
          <p className='muted'>
            Every question is matched two ways, by exact words and by meaning, then answered by an LLM on Groq
            using only what was found.
          </p>
        </div>
        <UploadPanel />
      </aside>

      <div className='stack'>
        <AskForm busy={busy} onAsk={ask} />
        {error && <p className='panel error'>{error}</p>}
        {result && (
          <section className='panel'>
            <h2>Answer</h2>
            <p className='answer'>{result.answer}</p>
            <p className='muted' style={{ marginTop: 12 }}>
              Retrieval {result.timing.retrievalMs} ms, reasoning {result.timing.llmMs} ms
            </p>
          </section>
        )}
        {result && result.sources.length > 0 && <Evidence hits={result.sources} />}
      </div>
    </main>
  )
}
