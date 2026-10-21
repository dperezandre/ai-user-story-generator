import type { Epic, Story } from '../core/types'

const INVEST_NOMES: Record<keyof Story['invest'], string> = {
  independente: 'independente',
  negociavel: 'negociável',
  valiosa: 'valiosa',
  estimavel: 'estimável',
  pequena: 'pequena',
  testavel: 'testável',
}

export function storyToMarkdown(s: Story, nivel = 2): string {
  const h = '#'.repeat(nivel)
  const linhas = [
    `${h} ${s.titulo}`,
    '',
    `Como ${s.persona}, quero ${s.quero}, para ${s.para}.`,
    '',
    `${h}# Critérios de aceite`,
    '',
    ...s.criteriosAceite.map((c) => `- **Dado** ${c.dado} **Quando** ${c.quando} **Então** ${c.entao}`),
  ]

  const reprovados = (Object.keys(s.invest) as (keyof Story['invest'])[]).filter((k) => !s.invest[k].ok)
  if (reprovados.length) {
    linhas.push('', `${h}# Pontos de atenção (INVEST)`, '', ...reprovados.map((k) => `- **${INVEST_NOMES[k]}:** ${s.invest[k].comentario}`))
  }
  if (s.perguntasRefinamento.length) {
    linhas.push('', `${h}# Perguntas de refinamento`, '', ...s.perguntasRefinamento.map((p) => `- ${p}`))
  }
  if (s.sugestaoQuebra?.length) {
    linhas.push('', `${h}# Sugestão de quebra`, '', ...s.sugestaoQuebra.map((p) => `- ${p}`))
  }
  if (s.dependeDe.length) {
    linhas.push('', `Depende de: ${s.dependeDe.join(', ')}`)
  }
  return linhas.join('\n') + '\n'
}

export function epicToMarkdown(e: Epic): string {
  const porId = new Map(e.stories.map((s) => [s.id, s]))
  const ordenadas = e.ordemSugerida.map((id) => porId.get(id)).filter((s): s is Story => !!s)
  const linhas = [
    `# ${e.titulo}`,
    '',
    `**Objetivo:** ${e.objetivo}`,
    '',
    `**Justificativa:** ${e.justificativa}`,
    '',
    `**Áreas impactadas:** ${e.areasImpactadas.join(', ') || '—'}`,
    '',
    '## Histórias (ordem sugerida)',
    '',
    ...ordenadas.map((s, i) => `${i + 1}. ${s.id} — ${s.titulo}`),
    '',
    ...ordenadas.map((s) => storyToMarkdown(s, 2)),
    '## Lacunas',
    '',
    ...e.lacunas.flatMap((l) => [`- **Trecho:** ${l.trecho}`, `  - **Problema:** ${l.problema}`, `  - **Pergunta:** ${l.pergunta}`]),
  ]
  return linhas.join('\n') + '\n'
}
