import { describe, it, expect } from 'vitest'
import { generateStory } from './generateStory'
import { historiaValida } from './fixtures'
import { PROMPTS } from '../prompts'
import type { LlmClient, LlmRequest } from '../llm/client'

function cliente(resposta: string) {
  const chamadas: LlmRequest[] = []
  const client: LlmClient = {
    async complete(r) {
      chamadas.push(r)
      return resposta
    },
  }
  return { client, chamadas }
}

describe('generateStory', () => {
  it.each(['', '   ', 'curta'])('rejeita entrada %j sem chamar a API', async (entrada) => {
    const { client, chamadas } = cliente('{}')
    const r = await generateStory(entrada, client)
    expect(!r.ok && r.error.kind).toBe('entrada')
    expect(chamadas).toHaveLength(0)
  })

  it('usa o prompt curto e devolve a história validada', async () => {
    const { client, chamadas } = cliente(JSON.stringify(historiaValida))
    const r = await generateStory('Médicos precisam aprovar protocolos sem duplicidade', client)
    expect(r.ok && r.value.id).toBe('H1')
    expect(chamadas[0].kind).toBe('curto')
    expect(chamadas[0].system).toBe(PROMPTS.curto.system)
    expect(chamadas[0].user).toContain('aprovar protocolos')
  })

  it('aceita resposta cercada por ```json', async () => {
    const { client } = cliente('```json\n' + JSON.stringify(historiaValida) + '\n```')
    const r = await generateStory('Médicos precisam aprovar protocolos sem duplicidade', client)
    expect(r.ok).toBe(true)
  })
})
