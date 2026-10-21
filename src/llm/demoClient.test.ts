import { describe, it, expect } from 'vitest'
import { DemoClient, EXEMPLO_CURTO, EXEMPLO_DOCUMENTO } from './demoClient'
import { extractJson } from '../core/json'
import { AnaliseSchema, StorySchema } from '../core/types'
import { AppError } from '../core/errors'
import { generateEpic } from '../core/generateEpic'
import { generateStory } from '../core/generateStory'

const demo = new DemoClient()
const req = (kind: 'curto' | 'analise' | 'detalhe', user = 'x') => ({ kind, system: 's', user })

describe('DemoClient', () => {
  it('devolve uma história curta válida', async () => {
    const r = StorySchema.safeParse(extractJson(await demo.complete(req('curto'))))
    expect(r.success).toBe(true)
  })

  it('devolve uma análise válida com pelo menos 5 lacunas', async () => {
    const a = AnaliseSchema.parse(extractJson(await demo.complete(req('analise'))))
    expect(a.lacunas.length).toBeGreaterThanOrEqual(5)
  })

  it('tem história detalhada válida para cada história da análise', async () => {
    const a = AnaliseSchema.parse(extractJson(await demo.complete(req('analise'))))
    for (const h of a.historias) {
      const texto = await demo.complete(req('detalhe', `ID: ${h.id}\nTítulo: ${h.titulo}`))
      expect(StorySchema.parse(extractJson(texto)).id).toBe(h.id)
    }
  })

  it('lança formato para id de história desconhecido', async () => {
    await expect(demo.complete(req('detalhe', 'ID: H99'))).rejects.toMatchObject({ kind: 'formato' })
    await expect(demo.complete(req('detalhe', 'ID: H99'))).rejects.toBeInstanceOf(AppError)
  })

  it('funciona de ponta a ponta com os exemplos embutidos', async () => {
    expect(EXEMPLO_CURTO.length).toBeGreaterThan(15)
    const curta = await generateStory(EXEMPLO_CURTO, demo)
    expect(curta.ok).toBe(true)
    const epico = await generateEpic(EXEMPLO_DOCUMENTO, demo)
    expect(epico.ok && epico.value.stories.length).toBeGreaterThanOrEqual(5)
  })
})
