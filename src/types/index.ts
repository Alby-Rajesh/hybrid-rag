export type Hit = {
  id: number
  source: string
  content: string
  keyword_rank: number | null
  semantic_rank: number | null
  keyword_score: number
  semantic_score: number
  rrf_score: number
}

export type Turn = { question: string; answer: string }

export type AnswerResult = {
  answer: string
  sources: Hit[]
  searchQuery: string
  emptyLibrary?: boolean
  timing: { retrievalMs: number; llmMs: number }
}

export type IngestResult = {
  ingested: { file: string; chunks: number }[]
}

export type LibraryDoc = { source: string; chunks: number }
export type LibraryResult = { documents: LibraryDoc[] }
