import { AppError, type ErrorKind } from '../core/errors'
import type { LlmClient, LlmRequest } from './client'

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

/**
 * Fala com o mini-servidor local (ver server/localAi.ts), que usa o Claude Code da própria pessoa.
 * Só existe em `npm run dev` / `npm run preview`; no GitHub Pages não há esse servidor.
 */
export class LocalClient implements LlmClient {
  constructor(private readonly fetchImpl: FetchLike = (...args) => fetch(...args)) {}

  async complete(req: LlmRequest): Promise<string> {
    let res: Response
    try {
      res = await this.fetchImpl('api/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(req),
      })
    } catch {
      throw new AppError('rede', 'Não foi possível falar com a IA local. O servidor do app (npm run dev) está rodando?')
    }

    let dados: { texto?: string; error?: { kind: ErrorKind; message: string } }
    try {
      dados = await res.json()
    } catch {
      throw new AppError('rede', 'A IA local devolveu uma resposta inválida.')
    }
    if (dados.error) throw new AppError(dados.error.kind, dados.error.message)
    if (typeof dados.texto !== 'string') throw new AppError('rede', 'A IA local devolveu uma resposta vazia.')
    return dados.texto
  }
}

export async function localAiDisponivel(fetchImpl: FetchLike = (...args) => fetch(...args)): Promise<boolean> {
  try {
    const res = await fetchImpl('api/status')
    return ((await res.json()) as { disponivel?: boolean }).disponivel === true
  } catch {
    return false
  }
}
