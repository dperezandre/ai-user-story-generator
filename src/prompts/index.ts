import curto from './curto.md?raw'
import analise from './analise.md?raw'
import detalhe from './detalhe.md?raw'
import enxutoAnalise from './enxuto-analise.md?raw'
import enxutoDetalhe from './enxuto-detalhe.md?raw'
import type { LlmKind } from '../llm/client'

export interface Prompt {
  versao: string
  system: string
}

function parse(raw: string): Prompt {
  const m = raw.match(/^versao:\s*(\d+)\s*\r?\n/)
  if (!m) throw new Error('Prompt sem linha "versao: <n>"')
  return { versao: m[1], system: raw.slice(m[0].length).trim() }
}

export const PROMPTS: Record<LlmKind, Prompt> = {
  curto: parse(curto),
  analise: parse(analise),
  detalhe: parse(detalhe),
}

export type Nivel = 'enxuto' | 'completo'

const ENXUTO = { analise: enxutoAnalise.trim(), detalhe: enxutoDetalhe.trim() }

/** Prompt de sistema da análise ou do detalhamento, com as instruções extras do modo enxuto quando pedido. */
export function systemPara(kind: 'analise' | 'detalhe', nivel: Nivel): string {
  return nivel === 'enxuto' ? `${PROMPTS[kind].system}\n\n${ENXUTO[kind]}` : PROMPTS[kind].system
}
