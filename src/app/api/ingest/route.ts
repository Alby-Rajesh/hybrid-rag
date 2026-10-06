import { HttpError, requireAdmin, route } from '@/lib/http'
import { ingestFile } from '@/lib/ingest'

export const runtime = 'nodejs'
export const maxDuration = 300

export const POST = route(async (req) => {
  requireAdmin(req)
  const files = (await req.formData()).getAll('files').filter((f): f is File => f instanceof File)
  if (!files.length) throw new HttpError(400, 'Attach at least one file')

  const ingested = []
  for (const file of files) ingested.push({ file: file.name, chunks: await ingestFile(file) })
  return { ingested }
})
