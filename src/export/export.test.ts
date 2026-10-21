import { describe, it, expect } from 'vitest'
import { storyToMarkdown, epicToMarkdown } from './markdown'
import { storyToAzureDevOps, azureClipboardHtml } from './azure'
import { historia, historiaValida } from '../core/fixtures'
import type { Epic } from '../core/types'

describe('storyToMarkdown', () => {
  it('traz título, frase da história e cada critério em Gherkin', () => {
    const md = storyToMarkdown(historiaValida)
    expect(md).toContain(`## ${historiaValida.titulo}`)
    expect(md).toContain('Como administrador, quero ligar ou desligar a funcionalidade por unidade, para controlar a liberação gradual.')
    expect(md).toContain('**Dado** uma unidade cadastrada **Quando** ligo a chave **Então** a funcionalidade fica ativa')
  })

  it('lista INVEST reprovado, perguntas e sugestão de quebra quando existem', () => {
    const md = storyToMarkdown({
      ...historiaValida,
      invest: { ...historiaValida.invest, pequena: { ok: false, comentario: 'grande demais' } },
      sugestaoQuebra: ['Parte A', 'Parte B'],
    })
    expect(md).toContain('pequena')
    expect(md).toContain('grande demais')
    expect(md).toContain('Quem pode ligar a chave?')
    expect(md).toContain('Parte A')
  })
})

describe('epicToMarkdown', () => {
  const epic: Epic = {
    titulo: 'Épico X',
    objetivo: 'obj',
    justificativa: 'just',
    areasImpactadas: ['Sistema A'],
    stories: [historia('H2'), historia('H1')],
    lacunas: [{ trecho: 'trecho citado', problema: 'problema X', pergunta: 'pergunta Y?' }],
    ordemSugerida: ['H2', 'H1'],
  }

  it('lista as histórias na ordem sugerida e uma seção de lacunas', () => {
    const md = epicToMarkdown(epic)
    expect(md.startsWith('# Épico X')).toBe(true)
    expect(md.indexOf('Historia H2')).toBeLessThan(md.indexOf('Historia H1'))
    expect(md).toContain('## Lacunas')
    expect(md).toContain('trecho citado')
    expect(md).toContain('problema X')
    expect(md).toContain('pergunta Y?')
  })
})

describe('azureClipboardHtml', () => {
  it('monta HTML rico com título escapado, descrição e critérios', () => {
    const html = azureClipboardHtml(storyToAzureDevOps({ ...historiaValida, titulo: '<img src=x onerror=alert(1)>' }))
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
    expect(html).toContain('<li>')
    expect(html).toContain('Como <b>administrador</b>')
  })
})

describe('storyToAzureDevOps', () => {
  it('usa o título da história e um <li> por critério de aceite', () => {
    const r = storyToAzureDevOps({
      ...historiaValida,
      criteriosAceite: [...historiaValida.criteriosAceite, { dado: 'b', quando: 'c', entao: 'd' }],
    })
    expect(r.title).toBe(historiaValida.titulo)
    expect(r.acceptanceCriteriaHtml.match(/<li>/g)).toHaveLength(2)
  })

  it('escapa HTML em todos os campos', () => {
    const r = storyToAzureDevOps({
      ...historiaValida,
      quero: '<script>alert("x")</script> & "aspas"',
      criteriosAceite: [{ dado: '<b>a</b>', quando: "c'd", entao: '&' }],
    })
    const tudo = r.descriptionHtml + r.acceptanceCriteriaHtml
    expect(tudo).not.toContain('<script>')
    expect(tudo).not.toContain('<b>a</b>')
    expect(tudo).toContain('&lt;script&gt;')
    expect(tudo).toContain('&amp;')
    expect(tudo).toContain('&quot;aspas&quot;')
  })
})
