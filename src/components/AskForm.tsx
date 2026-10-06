'use client'

import { useState, type FormEvent } from 'react'

type Props = { busy: boolean; onAsk: (question: string) => void }

export function AskForm({ busy, onAsk }: Props) {
  const [question, setQuestion] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (question.trim()) onAsk(question.trim())
  }

  return (
    <form className='panel' onSubmit={submit}>
      <label htmlFor='question' style={{ marginTop: 0 }}>Question</label>
      <textarea
        id='question'
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder='What does the leave policy say about carry-over days?'
      />
      <div className='row'>
        <span className='muted'>Matched by exact words and by meaning, then answered from those passages only.</span>
        <button type='submit' disabled={busy}>{busy ? 'Thinking…' : 'Ask'}</button>
      </div>
    </form>
  )
}
