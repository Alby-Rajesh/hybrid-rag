import type { Hit } from '@/types'
import { check, db } from './db'
import { embedQuery } from './embed'

export function toKeywordQuery(question: string) {
  const words = question.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}_.-]*/gu) ?? []
  return [...new Set(words.filter((w) => w.length > 2))].join(' or ')
}

export async function hybridSearch(question: string, matchCount = 6) {
  const hits = check(
    await db().rpc('hybrid_search', {
      query_text: toKeywordQuery(question) || question,
      query_embedding: await embedQuery(question),
      match_count: matchCount,
    })
  )
  return (hits ?? []) as Hit[]
}

export const formatContext = (hits: Hit[]) =>
  hits.length
    ? hits.map((h, i) => `[${i + 1}] ${h.source}\n${h.content}`).join('\n\n---\n\n')
    : 'No matching passages.'
