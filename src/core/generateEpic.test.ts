import { describe, it, expect } from 'vitest'
import { generateEpic, MAX_DOC_CHARS } from './generateEpic'
import { AppError } from './errors'
import { historia } from './fixtures'
import type { Analise } from './types'
import type { LlmClient, LlmRequest } from '../llm/client'

const DOC = 'Documento de requisitos com conteúdo suficiente para ser analisado pela IA.'

function analise(extra: Partial<Analise> = {}): Analise {
  return {
    titulo: 'Épico X',
    objetivo: 'obj',
    justificativa: 'just',
    areasImpactadas: ['Sistema A'],
    historias: ['H1', 'H2', 'H3'].map((id) => ({ id, titulo: `T${id}`, resumo: 'r', origem: 'o', dependeDe: [] })),
    lacunas: [{ trecho: 't', problema: 'p', pergunta: 'q' }],
    ordemSugerida: ['H2', 'H1', 'H3'],
    ...extra,
  }
}

function cliente(a: Analise, falhaNoDetalhe?: number) {
  const chamadas: LlmRequest[] = []
  let detalhes = 0
  const client: LlmClient = {
    async complete(r) {
      chamadas.push(r)
      if (r.kind === 'analise') return JSON.stringify(a)
      detalhes++
      if (detalhes === falhaNoDetalhe) throw new AppError('rede', 'caiu')
      const id = /ID: (\S+)/.exec(r.user)![1]
      return JSON.stringify(historia(id))
    },
  }
  return { client, chamadas }
}

describe('generateEpic', () => {
  it('quebra o documento em épico, detalha cada história e reporta progresso', async () => {
    const { client, chamadas } = cliente(analise())
    const progresso: [number, number][] = []
    const r = await generateEpic(DOC, client, (f, t) => progresso.push([f, t]))

    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.titulo).toBe('Épico X')
    expect(r.value.stories.map((s) => s.id)).toEqual(['H2', 'H1', 'H3'])
    expect(progresso).toEqual([[1, 3], [2, 3], [3, 3]])
    expect(chamadas.filter((c) => c.kind === 'analise')).toHaveLength(1)
    expect(chamadas.filter((c) => c.kind === 'detalhe')).toHaveLength(3)
  })

  describe('paralelismo', () => {
    const analise6 = () =>
      analise({
        historias: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].map((id) => ({ id, titulo: id, resumo: 'r', origem: 'o', dependeDe: [] })),
        ordemSugerida: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
      })

    function clienteLento(a: Analise, ms: (id: string) => number, falhaEm?: string) {
      let emVoo = 0
      let maxEmVoo = 0
      const iniciadas: string[] = []
      const client: LlmClient = {
        async complete(r) {
          if (r.kind === 'analise') return JSON.stringify(a)
          const id = /ID: (\S+)/.exec(r.user)![1]
          iniciadas.push(id)
          emVoo++
          maxEmVoo = Math.max(maxEmVoo, emVoo)
          await new Promise((res) => setTimeout(res, ms(id)))
          emVoo--
          if (id === falhaEm) throw new AppError('rede', 'caiu')
          return JSON.stringify(historia(id))
        },
      }
      return { client, iniciadas, maximo: () => maxEmVoo }
    }

    it('detalha até 4 histórias ao mesmo tempo por padrão', async () => {
      const { client, maximo } = clienteLento(analise6(), () => 15)
      const r = await generateEpic(DOC, client)
      expect(r.ok).toBe(true)
      expect(maximo()).toBe(4)
    })

    it('respeita o limite de simultaneidade informado', async () => {
      const { client, maximo } = clienteLento(analise6(), () => 15)
      await generateEpic(DOC, client, undefined, { concorrencia: 2 })
      expect(maximo()).toBe(2)
    })

    it('mantém a ordem sugerida mesmo quando a primeira história é a mais lenta', async () => {
      const { client } = clienteLento(analise6(), (id) => (id === 'H1' ? 60 : 5))
      const r = await generateEpic(DOC, client)
      expect(r.ok && r.value.stories.map((s) => s.id)).toEqual(['H1', 'H2', 'H3', 'H4', 'H5', 'H6'])
    })

    it('uma falha interrompe o início de novas histórias e devolve o erro tipado', async () => {
      const { client, iniciadas } = clienteLento(analise6(), () => 10, 'H1')
      const r = await generateEpic(DOC, client, undefined, { concorrencia: 2 })
      expect(!r.ok && r.error.kind).toBe('rede')
      expect(iniciadas.length).toBeLessThan(6)
    })
  })

  describe('nível de detalhe', () => {
    it('enxuto é o padrão e acrescenta as instruções do modo enxuto à análise e ao detalhamento', async () => {
      const { client, chamadas } = cliente(analise())
      await generateEpic(DOC, client)
      expect(chamadas.find((c) => c.kind === 'analise')!.system).toContain('MODO ENXUTO')
      expect(chamadas.find((c) => c.kind === 'detalhe')!.system).toContain('MODO ENXUTO')
    })

    it('completo mantém os prompts sem as instruções do modo enxuto', async () => {
      const { client, chamadas } = cliente(analise())
      await generateEpic(DOC, client, undefined, { nivel: 'completo' })
      for (const c of chamadas) expect(c.system).not.toContain('MODO ENXUTO')
    })
  })

  it('pede orçamento de tokens maior para a análise do documento', async () => {
    const { client, chamadas } = cliente(analise())
    await generateEpic(DOC, client)
    expect(chamadas[0].kind).toBe('analise')
    expect(chamadas[0].maxTokens).toBeGreaterThanOrEqual(8000)
  })

  it('remove de dependeDe e ordemSugerida ids que não existem', async () => {
    const a = analise({
      historias: [
        { id: 'H1', titulo: 'a', resumo: 'r', origem: 'o', dependeDe: ['H9'] },
        { id: 'H2', titulo: 'b', resumo: 'r', origem: 'o', dependeDe: ['H1'] },
      ],
      ordemSugerida: ['H9', 'H1', 'H2'],
    })
    const { client } = cliente(a)
    const r = await generateEpic(DOC, client)
    expect(r.ok && r.value.ordemSugerida).toEqual(['H1', 'H2'])
    expect(r.ok && r.value.stories[0].dependeDe).toEqual([])
    expect(r.ok && r.value.stories[1].dependeDe).toEqual(['H1'])
  })

  it('rejeita ids duplicados na análise', async () => {
    const a = analise({
      historias: [
        { id: 'H1', titulo: 'a', resumo: 'r', origem: 'o', dependeDe: [] },
        { id: 'H1', titulo: 'b', resumo: 'r', origem: 'o', dependeDe: [] },
      ],
      ordemSugerida: ['H1'],
    })
    const { client } = cliente(a)
    const r = await generateEpic(DOC, client)
    expect(!r.ok && r.error.kind).toBe('formato')
  })

  it('anexa ao fim as histórias ausentes de ordemSugerida', async () => {
    const { client } = cliente(analise({ ordemSugerida: ['H2', 'H1'] }))
    const r = await generateEpic(DOC, client)
    expect(r.ok && r.value.ordemSugerida).toEqual(['H2', 'H1', 'H3'])
  })

  it('rejeita documento acima do limite sem chamar a API', async () => {
    const { client, chamadas } = cliente(analise())
    const r = await generateEpic('x'.repeat(MAX_DOC_CHARS + 1), client)
    expect(!r.ok && r.error.kind).toBe('documento-grande')
    expect(chamadas).toHaveLength(0)
  })

  it.each(['', '   ', 'curto'])('rejeita entrada %j sem chamar a API', async (entrada) => {
    const { client, chamadas } = cliente(analise())
    const r = await generateEpic(entrada, client)
    expect(!r.ok && r.error.kind).toBe('entrada')
    expect(chamadas).toHaveLength(0)
  })

  it('falha de rede na segunda história devolve erro tipado, sem épico parcial', async () => {
    const { client } = cliente(analise(), 2)
    const r = await generateEpic(DOC, client)
    expect(r.ok).toBe(false)
    expect(!r.ok && r.error.kind).toBe('rede')
  })
})
