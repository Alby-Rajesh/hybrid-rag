'use client'

import { useEffect, useRef, useState } from 'react'
import { Composer } from '@/components/Composer'
import { Library } from '@/components/Library'
import { MessageView } from '@/components/MessageView'
import { CONTEXT_TURNS, useChat } from '@/lib/useChat'

const STARTERS = ['Summarise this document in five points', 'What are the key dates and numbers?', 'What skills and tools are mentioned?']

export default function Home() {
  const { messages, busy, ask, clear } = useChat()
  const [docCount, setDocCount] = useState<number | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const remembered = Math.min(CONTEXT_TURNS, messages.filter((m) => m.result && !m.result.emptyLibrary).length)

  return (
    <div className='app'>
      <aside className={`sidebar ${libraryOpen ? 'open' : ''}`}>
        <div className='brand'>
          <span className='mark' aria-hidden='true' />
          <div>
            <h1>Ask your documents</h1>
            <p className='muted small'>Hybrid search, answered on Groq</p>
          </div>
        </div>
        <Library onChange={setDocCount} />
        <p className='muted small foot'>
          Each question is matched by exact words and by meaning, the two rankings are fused, and the answer is written
          from those passages only.
        </p>
      </aside>

      <main className='chat'>
        <header className='chat-head'>
          <button type='button' className='quiet only-narrow' onClick={() => setLibraryOpen((v) => !v)} aria-expanded={libraryOpen}>
            Library{docCount !== null ? ` (${docCount})` : ''}
          </button>
          <span className='muted small'>
            {remembered > 0
              ? `Remembering the last ${remembered} ${remembered === 1 ? 'exchange' : 'exchanges'}`
              : `Follow-ups use the last ${CONTEXT_TURNS} exchanges`}
          </span>
          <button type='button' className='quiet' onClick={clear} disabled={busy || messages.length === 0}>
            New chat
          </button>
        </header>

        <div className='thread'>
          {messages.length === 0 ? (
            <div className='empty'>
              <h2>What would you like to know?</h2>
              <p className='muted'>
                {docCount === 0
                  ? 'Your library is empty. Add a document first, then ask anything about it.'
                  : 'Ask a question, then keep going with follow-ups. Every answer shows the passages it came from.'}
              </p>
              {docCount !== 0 && (
                <div className='starters'>
                  {STARTERS.map((text) => (
                    <button key={text} type='button' className='chip' onClick={() => ask(text)} disabled={busy}>
                      {text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            messages.map((message) => <MessageView key={message.id} message={message} />)
          )}
          <div ref={end} />
        </div>

        <div className='dock'>
          <Composer busy={busy} onAsk={ask} />
          <p className='muted small hint'>Enter to send, Shift+Enter for a new line</p>
        </div>
      </main>
    </div>
  )
}
