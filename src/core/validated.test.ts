import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { completeValidated } from './validated'
import { AppError } from './errors'
import type { LlmClient, LlmRequest } from '../llm/client'

const schema = z.object({ a: z.number() })
const req: LlmRequest = { kind: 'curto', system: 's', user: 'u' }

function clienteCom(respostas: (string | AppError)[]) {
  const chamadas: LlmRequest[] = []
  const client: LlmClient = {
    async complete(r) {
      chamadas.push(r)
      const proxima = respostas[chamadas.length - 1]
      if (proxima instanceof AppError) throw proxima
      return proxima
    },
  }
  return { client, chamadas }
}

describe('completeValidated', () => {
  it('faz uma única chamada quando a primeira resposta é válida', async () => {
    const { client, chamadas } = clienteCom(['{"a":1}'])
    const r = await completeValidated(client, req, schema)
    expect(r).toEqual({ ok: true, value: { a: 1 } })
    expect(chamadas).toHaveLength(1)
  })

  it('tenta de novo uma vez, anexando o erro de validação, e aceita a segunda resposta', async () => {
    const { client, chamadas } = clienteCom(['{"a":"x"}', '{"a":2}'])
    const r = await completeValidated(client, req, schema)
    expect(r.ok && r.value).toEqual({ a: 2 })
    expect(chamadas).toHaveLength(2)
    expect(chamadas[1].user).toContain('u')
    expect(chamadas[1].user).toMatch(/inválid|invalid|erro/i)
  })

  it('devolve formato após duas respostas inválidas', async () => {
    const { client, chamadas } = clienteCom(['nada', 'ainda nada'])
    const r = await completeValidated(client, req, schema)
    expect(!r.ok && r.error.kind).toBe('formato')
    expect(!r.ok && r.error.raw).toBe('ainda nada')
    expect(chamadas).toHaveLength(2)
  })

  it('converte erro inesperado do cliente em erro tipado de rede, sem retry', async () => {
    const chamadas: LlmRequest[] = []
    const client: LlmClient = {
      async complete(r) {
        chamadas.push(r)
        throw new TypeError('terminated')
      },
    }
    const r = await completeValidated(client, req, schema)
    expect(!r.ok && r.error.kind).toBe('rede')
    expect(chamadas).toHaveLength(1)
  })

  it('não faz retry quando o cliente lança AppError', async () => {
    const { client, chamadas } = clienteCom([new AppError('limite', 'x')])
    const r = await completeValidated(client, req, schema)
    expect(!r.ok && r.error.kind).toBe('limite')
    expect(chamadas).toHaveLength(1)
  })
})
