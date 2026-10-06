import type { LibraryDoc } from '@/types'
import { check, db } from './db'

const PAGE = 1000
const MAX_ROWS = 20000

/** Lists each uploaded file with its chunk count. */
export async function listDocuments(): Promise<LibraryDoc[]> {
  const counts = new Map<string, number>()
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const rows = check(
      await db().from('documents').select('source').order('id').range(from, from + PAGE - 1)
    ) as { source: string }[] | null
    for (const row of rows ?? []) counts.set(row.source, (counts.get(row.source) ?? 0) + 1)
    if (!rows || rows.length < PAGE) break
  }
  return [...counts].map(([source, chunks]) => ({ source, chunks })).sort((a, b) => a.source.localeCompare(b.source))
}

export async function removeDocument(source: string) {
  check(await db().from('documents').delete().eq('source', source))
}
