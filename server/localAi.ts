import type { IncomingMessage, ServerResponse } from 'node:http'
import { AppError } from '../src/core/errors'
import type { LlmClient, LlmKind, LlmRequest } from '../src/llm/client'

const KINDS: LlmKind[] = ['curto', 'analise', 'detalhe']
const MAX_BODY_BYTES = 1_000_000

interface Options {
  client: LlmClient
  disponivel: boolean
}

function responder(res: ServerResponse, status: number, corpo: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(corpo))
}

function lerCorpo(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let tamanho = 0
    const partes: Buffer[] = []
    req.on('data', (parte: Buffer) => {
      tamanho += parte.length
      if (tamanho > MAX_BODY_BYTES) {
        reject(new Error('corpo grande demais'))
        req.destroy()
        return
      }
      partes.push(parte)
    })
    req.on('end', () => resolve(Buffer.concat(partes).toString('utf-8')))
    req.on('error', reject)
  })
}

function pedidoValido(valor: unknown): LlmRequest | null {
  if (!valor || typeof valor !== 'object') return null
  const { kind, system, user, maxTokens } = valor as Record<string, unknown>
  if (!KINDS.includes(kind as LlmKind) || typeof system !== 'string' || typeof user !== 'string' || !system || !user) return null
  if (maxTokens !== undefined && typeof maxTokens !== 'number') return null
  return { kind: kind as LlmKind, system, user, ...(maxTokens !== undefined ? { maxTokens } : {}) }
}

/** Só aceita pedidos feitos pela própria página servida aqui: outro site aberto no navegador não pode gastar o Claude do usuário. */
function origemPermitida(req: IncomingMessage): boolean {
  const origem = req.headers.origin
  if (!origem || !req.headers.host) return false
  try {
    return new URL(origem).host === req.headers.host
  } catch {
    return false
  }
}

/** Middleware que expõe a IA local (Claude Code) para a página durante `npm run dev` e `npm run preview`. */
export function localAiHandler({ client, disponivel }: Options) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const caminho = (req.url ?? '').split('?')[0]

    if (req.method === 'GET' && caminho === '/api/status') {
      responder(res, 200, { disponivel })
      return
    }
    if (!(req.method === 'POST' && caminho === '/api/complete')) {
      next()
      return
    }

    if (!origemPermitida(req)) {
      responder(res, 403, { error: { kind: 'entrada', message: 'Origem não permitida.' } })
      return
    }

    void (async () => {
      let pedido: LlmRequest | null
      try {
        pedido = pedidoValido(JSON.parse(await lerCorpo(req)))
      } catch {
        pedido = null
      }
      if (!pedido) {
        responder(res, 400, { error: { kind: 'entrada', message: 'Pedido inválido.' } })
        return
      }
      try {
        responder(res, 200, { texto: await client.complete(pedido) })
      } catch (e) {
        if (e instanceof AppError) responder(res, 502, { error: { kind: e.kind, message: e.message } })
        else responder(res, 500, { error: { kind: 'rede', message: 'Falha inesperada ao chamar o Claude Code local.' } })
      }
    })()
  }
}
