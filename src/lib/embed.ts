import { env } from './env'

const MODEL = 'gemini-embedding-001'
const DIMENSIONS = 768
const BATCH_SIZE = 100
const MAX_RETRIES = 4
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:batchEmbedContents`

type Task = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const normalize = (vector: number[]) => {
  const norm = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0)) || 1
  return vector.map((x) => x / norm)
}

async function embedBatch(texts: string[], taskType: Task, attempt = 0): Promise<number[][]> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env('GEMINI_API_KEY') },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: `models/${MODEL}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: DIMENSIONS,
      })),
    }),
  })

  if (res.status === 429 && attempt < MAX_RETRIES) {
    await sleep(2 ** attempt * 2000)
    return embedBatch(texts, taskType, attempt + 1)
  }
  if (!res.ok) throw new Error(`Embedding failed (${res.status}): ${await res.text()}`)

  const { embeddings } = (await res.json()) as { embeddings: { values: number[] }[] }
  return embeddings.map((e) => normalize(e.values))
}

export async function embedDocuments(texts: string[]) {
  const vectors: number[][] = []
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    vectors.push(...(await embedBatch(texts.slice(i, i + BATCH_SIZE), 'RETRIEVAL_DOCUMENT')))
  }
  return vectors
}

export const embedQuery = async (text: string) => (await embedBatch([text], 'RETRIEVAL_QUERY'))[0]
