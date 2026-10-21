// @vitest-environment node
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { localAiHandler } from './localAi'
import { AppError } from '../src/core/errors'
import type { LlmClient } from '../src/llm/client'

let servidor: Server | undefined
afterEach(() => new Promise<void>((r) => (servidor ? servidor.close(() => r()) : r())))

async function subir(client: LlmClient, disponivel = true) {
  const proximo = vi.fn((_req, res) => {
    res.statusCode = 404
    res.end('outra rota')
  })
  const handler = localAiHandler({ client, disponivel })
  servidor = createServer((req, res) => handler(req, res, () => proximo(req, res)))
  await new Promise<void>((r) => servidor!.listen(0, '127.0.0.1', r))
  const { port } = servidor.address() as AddressInfo
  return { base: `http://127.0.0.1:${port}`, host: `127.0.0.1:${port}`, proximo }
}

const corpo = { kind: 'curto', system: 'sistema', user: 'pedido do usuário' }
const post = (base: string, origin: string | null, body: unknown) =>
  fetch(`${base}/api/complete`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) },
    body: JSON.stringify(body),
  })

describe('localAiHandler', () => {
  it('informa se a IA local está disponível', async () => {
    const { base } = await subir({ complete: vi.fn() }, true)
    expect(await (await fetch(`${base}/api/status`)).json()).toEqual({ disponivel: true })
  })

  it('informa indisponível quando o Claude Code não foi encontrado', async () => {
    const { base } = await subir({ complete: vi.fn() }, false)
    expect(await (await fetch(`${base}/api/status`)).json()).toEqual({ disponivel: false })
  })

  it('repassa o pedido ao cliente e devolve o texto quando a origem é a própria página', async () => {
    const complete = vi.fn().mockResolvedValue('{"ok":true}')
    const { base } = await subir({ complete })
    const r = await post(base, base, corpo)
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ texto: '{"ok":true}' })
    expect(complete).toHaveBeenCalledWith({ ...corpo })
  })

  it('recusa pedidos de outra origem sem chamar o cliente', async () => {
    const complete = vi.fn()
    const { base } = await subir({ complete })
    expect((await post(base, 'https://site-malicioso.example', corpo)).status).toBe(403)
    expect(complete).not.toHaveBeenCalled()
  })

  it('recusa pedidos sem cabeçalho Origin', async () => {
    const complete = vi.fn()
    const { base } = await subir({ complete })
    expect((await post(base, null, corpo)).status).toBe(403)
    expect(complete).not.toHaveBeenCalled()
  })

  it('devolve 400 para corpo inválido', async () => {
    const complete = vi.fn()
    const { base } = await subir({ complete })
    expect((await post(base, base, { kind: 'curto' })).status).toBe(400)
    expect((await post(base, base, { kind: 'outro', system: 's', user: 'u' })).status).toBe(400)
    expect(complete).not.toHaveBeenCalled()
  })

  it('devolve erro tipado quando o cliente falha', async () => {
    const complete = vi.fn().mockRejectedValue(new AppError('rede', 'Claude Code caiu'))
    const { base } = await subir({ complete })
    const r = await post(base, base, corpo)
    expect(r.status).toBe(502)
    expect(await r.json()).toEqual({ error: { kind: 'rede', message: 'Claude Code caiu' } })
  })

  it('deixa passar as demais rotas para o próximo middleware', async () => {
    const { base, proximo } = await subir({ complete: vi.fn() })
    expect((await fetch(`${base}/qualquer-coisa`)).status).toBe(404)
    expect(proximo).toHaveBeenCalledOnce()
  })
})
