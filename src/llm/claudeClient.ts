import { AppError } from '../core/errors'
import type { LlmClient, LlmRequest } from './client'

export const DEFAULT_MODEL = 'claude-sonnet-5-5'
const API_URL = 'https://api.anthropic.com/v1/messages'

export class ClaudeClient implements LlmClient {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = (...args) => fetch(...args),
  ) {}

  async complete(req: LlmRequest): Promise<string> {
    let res: Response
    try {
      res = await this.fetchImpl(API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          max_tokens: req.maxTokens ?? 4096,
          system: req.system,
          messages: [{ role: 'user', content: req.user }],
        }),
      })
    } catch {
      throw new AppError('rede', 'Não foi possível falar com a API. Verifique sua conexão.')
    }

    if (res.status === 401 || res.status === 403) {
      throw new AppError('chave-invalida', 'A chave de API foi recusada. Confira a chave ou use o modo demo.')
    }
    if (res.status === 429) {
      throw new AppError('limite', 'Limite de uso da API atingido. Tente de novo em instantes.')
    }
    if (!res.ok) {
      throw new AppError('rede', `A API respondeu com erro (${res.status}). Tente novamente.`)
    }

    let data: { stop_reason?: string; content?: { type: string; text?: string }[] }
    try {
      data = await res.json()
    } catch {
      throw new AppError('rede', 'A resposta da API chegou incompleta ou inválida. Tente novamente.')
    }
    if (data.stop_reason === 'max_tokens') {
      throw new AppError('formato', 'A resposta da IA foi cortada por ser longa demais. Divida o documento em partes menores.')
    }
    const bloco = data.content?.find((b) => b.type === 'text')
    if (!bloco?.text) throw new AppError('formato', 'A API não devolveu texto.')
    return bloco.text
  }
}
