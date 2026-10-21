import { describe, it, expect } from 'vitest'
import { trechosSemHistoria } from './coverage'
import { historia } from './fixtures'
import type { Epic } from './types'

function epico(extra: Partial<Epic> = {}): Epic {
  return {
    titulo: 'Épico',
    objetivo: 'o',
    justificativa: 'j',
    areasImpactadas: [],
    stories: [
      historia('H1', {
        titulo: 'Cadastro do procedimento unificado',
        quero: 'cadastrar o procedimento unificado com nome, classe e permissão de prescrição',
        origem: 'Bloco 1 do cadastro',
        criteriosAceite: [{ dado: 'um procedimento novo', quando: 'o usuário salva o cadastro', entao: 'o procedimento fica disponível para prescrição' }],
      }),
    ],
    lacunas: [],
    ordemSugerida: ['H1'],
    ...extra,
  }
}

describe('trechosSemHistoria', () => {
  it('não aponta linhas cujas palavras aparecem nas histórias', () => {
    const doc = 'O usuário deve cadastrar o procedimento unificado informando nome, classe e permissão de prescrição.'
    const r = trechosSemHistoria(doc, epico())
    expect(r.total).toBe(1)
    expect(r.fracos).toEqual([])
  })

  it('aponta linhas sem relação com nenhuma história, da menos para a mais coberta', () => {
    const doc = [
      'Relatório mensal de faturamento enviado automaticamente para a diretoria financeira.',
      'O usuário deve cadastrar o procedimento unificado informando nome, classe e prescrição médica.',
      'Integração noturna com o sistema legado de estoque e almoxarifado da rede hospitalar.',
    ].join('\n')
    const r = trechosSemHistoria(doc, epico())
    expect(r.total).toBe(3)
    expect(r.fracos.map((f) => f.linha)).toEqual([
      'Relatório mensal de faturamento enviado automaticamente para a diretoria financeira.',
      'Integração noturna com o sistema legado de estoque e almoxarifado da rede hospitalar.',
    ])
    expect(r.fracos[0].cobertura).toBeLessThan(0.45)
    expect(r.fracos[0].cobertura).toBeLessThanOrEqual(r.fracos[1].cobertura)
  })

  it('considera coberta a linha tratada em uma lacuna', () => {
    const doc = 'A notificação de pendência será enviada ao coordenador responsável pelo faturamento.'
    const sem = trechosSemHistoria(doc, epico())
    expect(sem.fracos).toHaveLength(1)
    const com = trechosSemHistoria(
      doc,
      epico({ lacunas: [{ trecho: 'notificação de pendência enviada ao coordenador', problema: 'não diz quem é o responsável pelo faturamento', pergunta: 'quem recebe?' }] }),
    )
    expect(com.fracos).toEqual([])
  })

  it('ignora linhas curtas, linhas de preenchimento e repetições', () => {
    const doc = [
      'Versão 1.0',
      'Fortaleza, ____ de ___________________ de __________',
      'Relatório mensal de faturamento enviado automaticamente para a diretoria financeira.',
      'Relatório mensal de faturamento enviado automaticamente para a diretoria financeira.',
    ].join('\n')
    const r = trechosSemHistoria(doc, epico())
    expect(r.total).toBe(1)
    expect(r.fracos).toHaveLength(1)
  })

  it('compara sem diferenciar maiúsculas nem acentos', () => {
    const doc = 'CADASTRAR O PROCEDIMENTO UNIFICADO COM NOME, CLASSE E PERMISSAO DE PRESCRICAO.'
    expect(trechosSemHistoria(doc, epico()).fracos).toEqual([])
  })

  it('documento vazio não tem trechos', () => {
    expect(trechosSemHistoria('', epico())).toEqual({ total: 0, fracos: [] })
  })
})
