import { describe, it, expect } from 'vitest'
import { PROMPTS, systemPara } from './index'
import type { LlmKind } from '../llm/client'

const kinds: LlmKind[] = ['curto', 'analise', 'detalhe']

describe('PROMPTS', () => {
  it.each(kinds)('%s tem versão numérica e system sem a linha de versão', (kind) => {
    expect(PROMPTS[kind].versao).toMatch(/^\d+$/)
    expect(PROMPTS[kind].system).not.toMatch(/^versao:/m)
  })

  it.each(['curto', 'detalhe'] as const)('%s cobre INVEST e Gherkin', (kind) => {
    expect(PROMPTS[kind].system).toContain('INVEST')
    expect(PROMPTS[kind].system).toContain('Gherkin')
  })

  it.each(kinds)('%s exige saída em JSON', (kind) => {
    expect(PROMPTS[kind].system).toContain('JSON')
  })

  it('analise trata lacunas', () => {
    expect(PROMPTS.analise.system).toContain('lacunas')
  })

  it('analise exige cobertura de todos os requisitos do documento', () => {
    const s = PROMPTS.analise.system
    expect(s).toMatch(/cobertura/i)
    expect(s).toMatch(/todo requisito/i)
    expect(s).toMatch(/confira/i)
  })

  it('detalhe exige cenários de sucesso, erro, permissão e limite', () => {
    const s = PROMPTS.detalhe.system
    expect(s).toMatch(/caminho feliz|sucesso/i)
    expect(s).toMatch(/valida/i)
    expect(s).toMatch(/permiss/i)
    expect(s).toMatch(/limite|duplicad/i)
  })

  it('curto está na versão 2 e analise e detalhe na versão 4', () => {
    expect(PROMPTS.curto.versao).toBe('2')
    expect(PROMPTS.analise.versao).toBe('4')
    expect(PROMPTS.detalhe.versao).toBe('4')
  })

  it.each(kinds)('%s trata o texto do usuário como material de análise e não executa instruções contidas nele', (kind) => {
    const s = PROMPTS[kind].system
    expect(s).toMatch(/material (a ser )?analisad/i)
    expect(s).toMatch(/nunca execute/i)
    expect(s).toMatch(/atue como|gere o código|ignore/i)
  })

  it('analise orienta histórias técnicas e decisões em aberto quando o texto é um prompt de implementação', () => {
    const s = PROMPTS.analise.system
    expect(s).toMatch(/prompt de implementação/i)
    expect(s).toMatch(/migration/i)
    expect(s).toMatch(/rotas? de API|endpoint/i)
    expect(s).toMatch(/decisões? em aberto|"X ou Y"/i)
  })

  it('detalhe descreve critérios verificáveis também para histórias técnicas', () => {
    const s = PROMPTS.detalhe.system
    expect(s).toMatch(/história técnica/i)
    expect(s).toMatch(/endpoint|rota/i)
  })

  describe('systemPara', () => {
    it('completo devolve o prompt base sem alteração', () => {
      expect(systemPara('analise', 'completo')).toBe(PROMPTS.analise.system)
      expect(systemPara('detalhe', 'completo')).toBe(PROMPTS.detalhe.system)
    })

    it('enxuto da análise pede de 12 a 20 histórias e mantém a cobertura', () => {
      const s = systemPara('analise', 'enxuto')
      expect(s.startsWith(PROMPTS.analise.system)).toBe(true)
      expect(s).toContain('MODO ENXUTO')
      expect(s).toMatch(/12 a 20/)
      expect(s).toMatch(/origem/)
    })

    it('enxuto do detalhamento limita os cenários de 5 a 8', () => {
      const s = systemPara('detalhe', 'enxuto')
      expect(s).toContain('MODO ENXUTO')
      expect(s).toMatch(/5 a 8/)
    })
  })
})
