'use client'

import { useEffect, useRef, useState } from 'react'
import type { Hit } from '@/types'

type Props = { hits: Hit[]; focus: { index: number; nonce: number } | null }

export function Evidence({ hits, focus }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const details = useRef<HTMLDetailsElement>(null)
  const topKeyword = Math.max(1e-6, ...hits.map((h) => h.keyword_score))

  useEffect(() => {
    if (!focus || !details.current) return
    details.current.open = true
    const target = details.current.querySelector<HTMLElement>(`[data-hit='${focus.index}']`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    target?.classList.remove('flash')
    void target?.offsetWidth
    target?.classList.add('flash')
  }, [focus])

  const files = new Set(hits.map((h) => h.source)).size

  return (
    <details className='evidence' ref={details}>
      <summary>
        {hits.length} passages from {files} {files === 1 ? 'file' : 'files'}
      </summary>
      <div className='legend'>
        <span className='keyword'>Word match</span>
        <span className='meaning'>Meaning match</span>
      </div>
      {hits.map((hit, i) => (
        <article className='hit' key={hit.id} data-hit={i + 1}>
          <div className='hit-head'>
            <span><span className='cite static'>{i + 1}</span> {hit.source}</span>
            <span className='muted small'>fused {hit.rrf_score.toFixed(4)}</span>
          </div>
          <div className='signals'>
            <div>
              {hit.keyword_rank ? `Word rank ${hit.keyword_rank}` : 'No word overlap'}
              <div className='track'>
                <div className='fill keyword' style={{ width: `${(hit.keyword_score / topKeyword) * 100}%` }} />
              </div>
            </div>
            <div>
              Similarity {hit.semantic_score.toFixed(2)}
              <div className='track'>
                <div className='fill meaning' style={{ width: `${Math.max(0, hit.semantic_score) * 100}%` }} />
              </div>
            </div>
          </div>
          <p className={`hit-text ${expanded === hit.id ? 'open' : ''}`}>{hit.content}</p>
          <button type='button' className='quiet' onClick={() => setExpanded(expanded === hit.id ? null : hit.id)}>
            {expanded === hit.id ? 'Show less' : 'Show full passage'}
          </button>
        </article>
      ))}
    </details>
  )
}
