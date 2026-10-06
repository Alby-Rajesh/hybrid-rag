import { chunkText } from './chunk'
import { check, db } from './db'
import { embedDocuments } from './embed'
import { extractText } from './extract'

const INSERT_BATCH = 100

export async function ingestFile(file: File) {
  const chunks = chunkText(await extractText(file))
  if (!chunks.length) return 0

  const vectors = await embedDocuments(chunks)
  const rows = chunks.map((content, i) => ({
    source: file.name,
    chunk_index: i,
    content,
    embedding: vectors[i],
  }))

  check(await db().from('documents').delete().eq('source', file.name))
  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    check(await db().from('documents').insert(rows.slice(i, i + INSERT_BATCH)))
  }
  return chunks.length
}
