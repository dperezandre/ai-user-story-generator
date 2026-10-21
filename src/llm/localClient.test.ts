import { describe, it, expect, vi } from 'vitest'
import { LocalClient, localAiDisponivel } from './localClient'
import { AppError } from '../core/errors'
import type { LlmRequest } from './client'

const req: LlmRequest = { kind: 'analise', system: 'sistema', user: 'documento', maxTokens: 9000 }
const json = (status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status })

async function erroDe(p: Promise<unknown>): Promise<AppError> {
  try {
    await p
  } catch (e) {
    return e as AppError
  }
  throw new Error('esperava um erro')
}

describe('LocalClient', () => {
  it('envia o pedido para api/complete e devolve o texto', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(200, { texto: '{"a":1}' }))
    const texto = await new LocalClient(fetchImpl).complete(req)

    expect(texto).toBe('{"a":1}')
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('api/complete')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual(req)
  })

  it('repassa o erro tipado devolvido pelo servidor local', async () => {
    const c = new LocalClient(vi.fn().mockResolvedValue(json(502, { error: { kind: 'limite', message: 'sem cota' } })))
    const e = await erroDe(c.complete(req))
    expect(e.kind).toBe('limite')
    expect(e.message).toBe('sem cota')
  })

  it('vira erro de rede quando o servidor local não responde', async () => {
    const c = new LocalClient(vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    expect((await erroDe(c.complete(req))).kind).toBe('rede')
  })

  it('vira erro de rede quando a resposta não é o JSON esperado', async () => {
    const c = new LocalClient(vi.fn().mockResolvedValue(new Response('<html>', { status: 200 })))
    expect((await erroDe(c.complete(req))).kind).toBe('rede')
  })
})

describe('localAiDisponivel', () => {
  it('é true só quando o servidor responde disponivel: true', async () => {
    expect(await localAiDisponivel(vi.fn().mockResolvedValue(json(200, { disponivel: true })))).toBe(true)
    expect(await localAiDisponivel(vi.fn().mockResolvedValue(json(200, { disponivel: false })))).toBe(false)
  })

  it('é false quando não há servidor (404, HTML ou falha de rede)', async () => {
    expect(await localAiDisponivel(vi.fn().mockResolvedValue(new Response('<html>', { status: 404 })))).toBe(false)
    expect(await localAiDisponivel(vi.fn().mockRejectedValue(new TypeError('x')))).toBe(false)
  })
})
