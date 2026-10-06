'use client'

import { useState } from 'react'
import type { Hit } from '@/types'

export function Evidence({ hits }: { hits: Hit[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const topKeyword = Math.max(1e-6, ...hits.map((h) => h.keyword_score))

  return (
    <section className='panel'>
      <h2>Evidence used</h2>
      <div className='legend'>
        <span className='keyword'>Word match</span>
        <span className='meaning'>Meaning match</span>
      </div>
      {hits.map((hit, i) => (
        <article className='hit' key={hit.id}>
          <div className='hit-head'>
            <span>[{i + 1}] {hit.source}</span>
            <span className='muted'>fused {hit.rrf_score.toFixed(4)}</span>
          </div>
          <div className='signals'>
            <div>
              {hit.keyword_rank ? `Rank ${hit.keyword_rank}` : 'No word overlap'}
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
          <p className={`hit-text ${open === hit.id ? 'open' : ''}`}>{hit.content}</p>
          <button type='button' className='quiet' onClick={() => setOpen(open === hit.id ? null : hit.id)}>
            {open === hit.id ? 'Show less' : 'Show full passage'}
          </button>
        </article>
      ))}
    </section>
  )
}
