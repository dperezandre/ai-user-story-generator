import { AppError } from '../core/errors'
import type { LlmClient, LlmRequest } from './client'
import curtoJson from './demo-data/curto.json'
import analiseJson from './demo-data/analise.json'
import detalhesJson from './demo-data/detalhes.json'
import exemploCurto from '../../examples/necessidade-curta.md?raw'
import exemploDocumento from '../../examples/documento-rede-vita.md?raw'

// Normaliza quebras de linha: um checkout com CRLF não pode divergir do valor que o <textarea> devolve.
const normaliza = (texto: string) => texto.replace(/\r\n/g, '\n').trim()

export const EXEMPLO_CURTO: string = normaliza(exemploCurto)
export const EXEMPLO_DOCUMENTO: string = normaliza(exemploDocumento)

export interface DemoFixtures {
  curto: unknown
  analise: unknown
  detalhes: Record<string, unknown>
}

const PADRAO: DemoFixtures = { curto: curtoJson, analise: analiseJson, detalhes: detalhesJson }

export class DemoClient implements LlmClient {
  constructor(private readonly fixtures: DemoFixtures = PADRAO) {}

  async complete(req: LlmRequest): Promise<string> {
    if (req.kind === 'curto') return JSON.stringify(this.fixtures.curto)
    if (req.kind === 'analise') return JSON.stringify(this.fixtures.analise)

    const id = /ID:\s*(\S+)/.exec(req.user)?.[1]
    const historia = id ? this.fixtures.detalhes[id] : undefined
    if (!historia) {
      throw new AppError('formato', `O modo demo não tem a história ${id ?? '(sem id)'}. Use sua chave para gerar resultados reais.`)
    }
    return JSON.stringify(historia)
  }
}
