'use client'

import { useCallback, useEffect, useState } from 'react'
import { request } from '@/lib/client'
import { ACCEPTED_TYPES } from '@/lib/extract'
import type { IngestResult, LibraryDoc, LibraryResult } from '@/types'

const KEY_STORAGE = 'hybrid-rag.admin-key'

export function Library({ onChange }: { onChange?: (count: number) => void }) {
  const [docs, setDocs] = useState<LibraryDoc[] | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [adminKey, setAdminKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ text: string; bad?: boolean } | null>(null)
  const [inputKey, setInputKey] = useState(0)

  const apply = useCallback(
    (documents: LibraryDoc[]) => {
      setDocs(documents)
      onChange?.(documents.length)
    },
    [onChange]
  )

  useEffect(() => {
    try {
      setAdminKey(sessionStorage.getItem(KEY_STORAGE) ?? '')
    } catch {}
    request<LibraryResult>('/api/documents', { method: 'GET', cache: 'no-store' })
      .then((r) => apply(r.documents))
      .catch((err) => {
        setDocs([])
        setStatus({ text: (err as Error).message, bad: true })
      })
  }, [apply])

  function rememberKey(value: string) {
    setAdminKey(value)
    try {
      sessionStorage.setItem(KEY_STORAGE, value)
    } catch {}
  }

  async function upload() {
    if (!files.length) return setStatus({ text: 'Choose at least one file first.', bad: true })
    const body = new FormData()
    files.forEach((file) => body.append('files', file))

    setBusy(true)
    setStatus({ text: `Reading and indexing ${files.length === 1 ? files[0].name : `${files.length} files`}…` })
    try {
      const { ingested } = await request<IngestResult>('/api/ingest', {
        method: 'POST',
        headers: adminKey ? { 'x-admin-key': adminKey } : undefined,
        body,
      })
      const empty = ingested.filter((r) => r.chunks === 0).map((r) => r.file)
      setStatus(
        empty.length
          ? { text: `No readable text found in ${empty.join(', ')}. Scanned PDFs need OCR first.`, bad: true }
          : { text: `Added ${ingested.map((r) => `${r.file} (${r.chunks} passages)`).join(', ')}.` }
      )
      setFiles([])
      setInputKey((k) => k + 1)
      apply((await request<LibraryResult>('/api/documents', { method: 'GET', cache: 'no-store' })).documents)
    } catch (err) {
      setStatus({ text: (err as Error).message, bad: true })
    } finally {
      setBusy(false)
    }
  }

  async function remove(source: string) {
    setBusy(true)
    setStatus(null)
    try {
      const { documents } = await request<LibraryResult>(`/api/documents?source=${encodeURIComponent(source)}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      })
      apply(documents)
    } catch (err) {
      setStatus({ text: (err as Error).message, bad: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className='library' aria-labelledby='library-title'>
      <h2 id='library-title'>Library</h2>

      {docs === null && <p className='muted small'>Loading…</p>}
      {docs?.length === 0 && <p className='muted small'>No documents yet. Add one below to start asking.</p>}
      {docs && docs.length > 0 && (
        <ul className='docs'>
          {docs.map((doc) => (
            <li key={doc.source}>
              <span className='doc-name' title={doc.source}>{doc.source}</span>
              <span className='muted small'>{doc.chunks}</span>
              {adminKey && (
                <button type='button' className='icon' disabled={busy} onClick={() => remove(doc.source)} aria-label={`Remove ${doc.source}`} title='Remove'>
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className='upload'>
        <label htmlFor='files'>Add documents</label>
        <input key={inputKey} id='files' type='file' multiple accept={ACCEPTED_TYPES} onChange={(e) => setFiles([...(e.target.files ?? [])])} />
        <p className='muted small'>PDF, TXT, MD, CSV or JSON. Up to 3 files, 4 MB each. No sign-in needed.</p>
        <button type='button' className='wide' onClick={upload} disabled={busy}>
          {busy ? 'Working…' : 'Add to library'}
        </button>
        {status && <p className={`small status ${status.bad ? 'error' : 'ok'}`} role='status'>{status.text}</p>}
        <details className='owner'>
          <summary>Owner tools</summary>
          <label htmlFor='admin-key'>Admin key</label>
          <input id='admin-key' type='password' autoComplete='off' value={adminKey} onChange={(e) => rememberKey(e.target.value)} />
          <p className='muted small'>Enter the key to remove documents from the library.</p>
        </details>
      </div>
    </section>
  )
}
