import { AppError } from './errors'

function balancedObject(text: string): string | null {
  const start = text.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (c === '\\') escaped = true
      else if (c === '"') inString = false
      continue
    }
    if (c === '"') inString = true
    else if (c === '{') depth++
    else if (c === '}' && --depth === 0) return text.slice(start, i + 1)
  }
  return null
}

export function extractJson(text: string): unknown {
  const semCercas = text.replace(/```(?:json)?/gi, '').trim()
  try {
    return JSON.parse(semCercas)
  } catch {
    const trecho = balancedObject(semCercas)
    if (trecho) {
      try {
        return JSON.parse(trecho)
      } catch {
        /* cai no erro abaixo */
      }
    }
    throw new AppError('formato', 'A resposta da IA não veio em JSON válido.', text)
  }
}
