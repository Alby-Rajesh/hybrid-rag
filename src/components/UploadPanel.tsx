'use client'

import { useState } from 'react'
import { request } from '@/lib/client'
import { ACCEPTED_TYPES } from '@/lib/extract'
import type { IngestResult } from '@/types'

export function UploadPanel() {
  const [files, setFiles] = useState<File[]>([])
  const [adminKey, setAdminKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')

  async function upload() {
    if (!files.length) return setStatus('Choose at least one file.')
    const body = new FormData()
    files.forEach((file) => body.append('files', file))

    setBusy(true)
    setStatus('')
    try {
      const { ingested } = await request<IngestResult>('/api/ingest', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
        body,
      })
      setStatus(ingested.map((r) => `${r.file}: ${r.chunks} chunks`).join('\n'))
    } catch (err) {
      setStatus((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='panel'>
      <h2>Add documents</h2>
      <p className='muted'>PDF, TXT, MD, CSV or JSON, up to about 4 MB per upload.</p>
      <label htmlFor='files'>Files</label>
      <input id='files' type='file' multiple accept={ACCEPTED_TYPES} onChange={(e) => setFiles([...(e.target.files ?? [])])} />
      <label htmlFor='admin-key'>Admin key</label>
      <input id='admin-key' type='password' value={adminKey} onChange={(e) => setAdminKey(e.target.value)} />
      <div className='row'>
        <button type='button' onClick={upload} disabled={busy}>{busy ? 'Adding…' : 'Add to library'}</button>
      </div>
      {status && <p className='muted pre' style={{ marginTop: 12 }}>{status}</p>}
    </div>
  )
}
