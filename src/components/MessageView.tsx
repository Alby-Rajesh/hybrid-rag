'use client'

import { useState } from 'react'
import type { Message } from '@/lib/useChat'
import { Evidence } from './Evidence'

const CITATION = /(\[\d+\])/g

export function MessageView({ message }: { message: Message }) {
  const [focus, setFocus] = useState<{ index: number; nonce: number } | null>(null)
  const { question, result, error } = message
  const rewritten = result && result.searchQuery.trim().toLowerCase() !== question.trim().toLowerCase()

  return (
    <div className='turn'>
      <div className='bubble user'>{question}</div>

      <div className='bubble bot'>
        {!result && !error && (
          <p className='thinking' role='status'>
            <span className='dots' aria-hidden='true'><i /><i /><i /></span>
            Searching your documents
          </p>
        )}

        {error && <p className='error' role='alert'>{error}</p>}

        {result && (
          <>
            <p className='answer'>
              {result.answer.split(CITATION).map((part, i) => {
                const n = Number(part.match(/^\[(\d+)\]$/)?.[1])
                const hit = n ? result.sources[n - 1] : undefined
                if (!hit) return <span key={i}>{part}</span>
                return (
                  <button
                    key={i}
                    type='button'
                    className='cite'
                    title={hit.source}
                    aria-label={`Source ${n}: ${hit.source}`}
                    onClick={() => setFocus({ index: n, nonce: Date.now() })}
                  >
                    {n}
                  </button>
                )
              })}
            </p>

            {result.sources.length > 0 && <Evidence hits={result.sources} focus={focus} />}

            <p className='meta'>
              {rewritten && <span>Searched for “{result.searchQuery}”</span>}
              <span>Retrieval {result.timing.retrievalMs} ms</span>
              {result.timing.llmMs > 0 && <span>Reasoning {result.timing.llmMs} ms</span>}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
