'use client'

import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

type Props = { busy: boolean; onAsk: (question: string) => void }

export function Composer({ busy, onAsk }: Props) {
  const [question, setQuestion] = useState('')
  const field = useRef<HTMLTextAreaElement>(null)

  function send() {
    const text = question.trim()
    if (!text || busy) return
    onAsk(text)
    setQuestion('')
    if (field.current) field.current.style.height = 'auto'
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    send()
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  function grow() {
    const el = field.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }

  return (
    <form className='composer' onSubmit={submit}>
      <label htmlFor='question' className='sr-only'>Ask a question about your documents</label>
      <textarea
        id='question'
        ref={field}
        rows={1}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onInput={grow}
        onKeyDown={onKeyDown}
        placeholder='Ask about your documents…'
      />
      <button type='submit' disabled={busy || !question.trim()} aria-label='Send question'>
        {busy ? <span className='spinner' aria-hidden='true' /> : (
          <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
            <path d='M12 19V5M5 12l7-7 7 7' />
          </svg>
        )}
      </button>
    </form>
  )
}
