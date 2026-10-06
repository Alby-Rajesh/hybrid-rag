const TEXT_FILE = /\.(txt|md|markdown|csv|json)$/i
const PDF_FILE = /\.pdf$/i

export const ACCEPTED_TYPES = '.pdf,.txt,.md,.markdown,.csv,.json'

export async function extractText(file: File) {
  if (TEXT_FILE.test(file.name)) return file.text()
  if (!PDF_FILE.test(file.name)) throw new Error(`Unsupported file type: ${file.name}`)

  const { extractText: readPdf, getDocumentProxy } = await import('unpdf')
  const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()))
  const { text } = await readPdf(pdf, { mergePages: true })
  return text
}
