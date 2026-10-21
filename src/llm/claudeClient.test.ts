import { describe, it, expect, vi } from 'vitest'
import { ClaudeClient, DEFAULT_MODEL } from './claudeClient'
import { AppError } from '../core/errors'
import type { LlmRequest } from './client'

const req: LlmRequest = { kind: 'curto', system: 'sistema', user: 'usuario' }

function resposta(status: number, corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), { status })
}

async function erroDe(p: Promise<unknown>): Promise<AppError> {
  try {
    await p
  } catch (e) {
    return e as AppError
  }
  throw new Error('esperava um erro')
}

describe('ClaudeClient', () => {
  it('envia a requisição com os cabeçalhos e o corpo esperados', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(resposta(200, { content: [{ type: 'text', text: 'olá' }] }))
    const texto = await new ClaudeClient('sk-ant-segredo', fetchImpl).complete(req)

    expect(texto).toBe('olá')
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      'x-api-key': 'sk-ant-segredo',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    })
    expect(JSON.parse(init.body)).toEqual({
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      system: 'sistema',
      messages: [{ role: 'user', content: 'usuario' }],
    })
  })

  it('mapeia 401 para chave-invalida', async () => {
    const c = new ClaudeClient('k', vi.fn().mockResolvedValue(resposta(401, {})))
    expect((await erroDe(c.complete(req))).kind).toBe('chave-invalida')
  })

  it('mapeia 429 para limite', async () => {
    const c = new ClaudeClient('k', vi.fn().mockResolvedValue(resposta(429, {})))
    expect((await erroDe(c.complete(req))).kind).toBe('limite')
  })

  it('mapeia 500 e falha de fetch para rede', async () => {
    const c500 = new ClaudeClient('k', vi.fn().mockResolvedValue(resposta(500, {})))
    expect((await erroDe(c500.complete(req))).kind).toBe('rede')
    const cFalha = new ClaudeClient('k', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    expect((await erroDe(cFalha.complete(req))).kind).toBe('rede')
  })

  it('lança formato com mensagem clara quando a resposta foi cortada por max_tokens', async () => {
    const corpo = { stop_reason: 'max_tokens', content: [{ type: 'text', text: '{"a":' }] }
    const c = new ClaudeClient('k', vi.fn().mockResolvedValue(resposta(200, corpo)))
    const e = await erroDe(c.complete(req))
    expect(e.kind).toBe('formato')
    expect(e.message).toMatch(/cortada|longa/i)
  })

  it('corpo 200 que não é JSON vira erro tipado de rede', async () => {
    const c = new ClaudeClient('k', vi.fn().mockResolvedValue(new Response('<html>', { status: 200 })))
    expect((await erroDe(c.complete(req))).kind).toBe('rede')
  })

  it('falha ao ler o corpo (conexão cai) vira erro tipado de rede', async () => {
    const quebrada = { ok: true, status: 200, json: () => Promise.reject(new TypeError('terminated')) } as unknown as Response
    const c = new ClaudeClient('k', vi.fn().mockResolvedValue(quebrada))
    expect((await erroDe(c.complete(req))).kind).toBe('rede')
  })

  it('nunca inclui a chave nas mensagens de erro', async () => {
    const c = new ClaudeClient('sk-ant-segredo', vi.fn().mockResolvedValue(resposta(401, { error: 'sk-ant-segredo' })))
    const e = await erroDe(c.complete(req))
    expect(e.message).not.toContain('sk-ant-segredo')
  })
})
