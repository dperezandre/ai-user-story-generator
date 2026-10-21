import { describe, it, expect } from 'vitest'
import { scoreStory, scoreEpic } from './score'
import { historia, historiaValida } from '../src/core/fixtures'
import type { Epic } from '../src/core/types'

describe('scoreStory', () => {
  it('conta cenários e detecta cenário de erro', () => {
    const s = historia('H1', {
      criteriosAceite: [
        { dado: 'a', quando: 'b', entao: 'c' },
        { dado: 'a', quando: 'b', entao: 'd' },
        { dado: 'código inexistente', quando: 'salva', entao: 'o sistema exibe mensagem de erro' },
      ],
    })
    const r = scoreStory(s)
    expect(r.gherkinCount).toBe(3)
    expect(r.temCenarioDeErro).toBe(true)
  })

  it('não vê cenário de erro quando todos são de sucesso', () => {
    expect(scoreStory(historiaValida).temCenarioDeErro).toBe(false)
  })

  it('lista os critérios INVEST reprovados e conta as perguntas', () => {
    const s = historia('H1', { invest: { ...historiaValida.invest, pequena: { ok: false, comentario: 'x' } } })
    const r = scoreStory(s)
    expect(r.investReprovados).toEqual(['pequena'])
    expect(r.perguntas).toBe(1)
  })
})

describe('scoreEpic', () => {
  const base: Epic = {
    titulo: 't',
    objetivo: 'o',
    justificativa: 'j',
    areasImpactadas: [],
    stories: [historia('H1'), historia('H2', { dependeDe: ['H1'] })],
    lacunas: Array.from({ length: 5 }, () => ({ trecho: 't', problema: 'p', pergunta: 'q' })),
    ordemSugerida: ['H1', 'H2'],
  }

  it('atende ao mínimo de lacunas e tem ids consistentes', () => {
    const r = scoreEpic(base, { lacunasMin: 5 })
    expect(r).toEqual({ historias: 2, lacunas: 5, atendeLacunas: true, idsConsistentes: true })
  })

  it('reprova quando há menos lacunas que o mínimo', () => {
    expect(scoreEpic({ ...base, lacunas: [] }, { lacunasMin: 5 }).atendeLacunas).toBe(false)
  })

  it('detecta id inexistente em ordemSugerida ou dependeDe', () => {
    expect(scoreEpic({ ...base, ordemSugerida: ['H1', 'H9'] }, { lacunasMin: 0 }).idsConsistentes).toBe(false)
    expect(scoreEpic({ ...base, stories: [historia('H1', { dependeDe: ['H9'] })], ordemSugerida: ['H1'] }, { lacunasMin: 0 }).idsConsistentes).toBe(false)
  })
})
