import { NextResponse } from 'next/server'

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export const route =
  (handler: (req: Request) => Promise<unknown>) =>
  async (req: Request) => {
    try {
      return NextResponse.json(await handler(req))
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500
      const message = err instanceof Error ? err.message : 'Unexpected error'
      return NextResponse.json({ error: message }, { status })
    }
  }

export function requireAdmin(req: Request) {
  const key = process.env.ADMIN_KEY
  if (key && req.headers.get('x-admin-key') !== key) throw new HttpError(401, 'Wrong or missing admin key')
}

export async function readFields<K extends string>(req: Request, ...keys: K[]) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const fields = {} as Record<K, string>
  for (const key of keys) {
    const value = body[key]
    if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, `Missing ${key}`)
    fields[key] = value.trim()
  }
  return fields
}
