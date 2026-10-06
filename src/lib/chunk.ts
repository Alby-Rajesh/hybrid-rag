const splitLong = (text: string, size: number) =>
  text.length > size ? (text.match(new RegExp(`[\\s\\S]{1,${size}}`, 'g')) ?? []) : [text]

export function chunkText(text: string, size = 900, overlap = 150) {
  const sentences = text
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .flatMap((s) => splitLong(s.trim(), size))
    .filter(Boolean)

  const chunks: string[] = []
  let current: string[] = []
  let length = 0

  for (const sentence of sentences) {
    if (length + sentence.length > size && current.length) {
      chunks.push(current.join(' '))
      const budget = Math.min(overlap, size - sentence.length)
      const kept: string[] = []
      let keptLength = 0
      for (let i = current.length - 1; i >= 0 && keptLength + current[i].length + 1 <= budget; i--) {
        kept.unshift(current[i])
        keptLength += current[i].length + 1
      }
      current = kept
      length = keptLength
    }
    current.push(sentence)
    length += sentence.length + 1
  }

  if (current.length) chunks.push(current.join(' '))
  return chunks
}
