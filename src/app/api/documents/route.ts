import { HttpError, requireAdmin, route } from '@/lib/http'
import { listDocuments, removeDocument } from '@/lib/library'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async () => ({ documents: await listDocuments() }))

export const DELETE = route(async (req) => {
  requireAdmin(req)
  const source = new URL(req.url).searchParams.get('source')?.trim()
  if (!source) throw new HttpError(400, 'Missing source')
  await removeDocument(source)
  return { documents: await listDocuments() }
})
