import { HttpError, isAdmin, route } from '@/lib/http'
import { ingestFile } from '@/lib/ingest'
import { listDocuments } from '@/lib/library'

export const runtime = 'nodejs'
export const maxDuration = 300

// Uploads are open so visitors can try the demo; these limits keep the library and the API quotas in check.
const MAX_FILES_PER_UPLOAD = 3
const MAX_FILE_BYTES = 4 * 1024 * 1024
const MAX_LIBRARY_DOCUMENTS = 25

export const POST = route(async (req) => {
  const files = (await req.formData()).getAll('files').filter((f): f is File => f instanceof File)
  if (!files.length) throw new HttpError(400, 'Attach at least one file')

  if (!isAdmin(req)) {
    if (files.length > MAX_FILES_PER_UPLOAD) throw new HttpError(400, `Upload at most ${MAX_FILES_PER_UPLOAD} files at a time`)
    const tooBig = files.find((f) => f.size > MAX_FILE_BYTES)
    if (tooBig) throw new HttpError(413, `${tooBig.name} is larger than 4 MB`)

    const existing = new Set((await listDocuments()).map((d) => d.source))
    const added = files.filter((f) => !existing.has(f.name)).length
    if (existing.size + added > MAX_LIBRARY_DOCUMENTS) {
      throw new HttpError(409, `The demo library is full (${MAX_LIBRARY_DOCUMENTS} documents). Try asking about the existing ones.`)
    }
  }

  const ingested = []
  for (const file of files) ingested.push({ file: file.name, chunks: await ingestFile(file) })
  return { ingested }
})
