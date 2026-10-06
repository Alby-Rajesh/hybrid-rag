import { answer } from '@/lib/answer'
import { readFields, route } from '@/lib/http'

export const runtime = 'nodejs'
export const maxDuration = 60

export const POST = route(async (req) => {
  const { question } = await readFields(req, 'question')
  return answer(question)
})
