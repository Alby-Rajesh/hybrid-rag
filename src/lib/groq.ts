import Groq from 'groq-sdk'
import { env } from './env'

let client: Groq | undefined

export const groq = () => (client ??= new Groq({ apiKey: env('GROQ_API_KEY') }))

export const chatModel = () => process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
