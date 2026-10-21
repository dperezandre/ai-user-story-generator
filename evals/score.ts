import type { Epic, Story } from '../src/core/types'

const SINAIS_DE_ERRO = /erro|inv[aá]lid|impede|bloque|recus|n[aã]o (for|foi|pode|existe|encontrad)|inexistente|mensagem/i

export function scoreStory(s: Story) {
  return {
    gherkinCount: s.criteriosAceite.length,
    temCenarioDeErro: s.criteriosAceite.some((c) => SINAIS_DE_ERRO.test(`${c.dado} ${c.quando} ${c.entao}`)),
    investReprovados: (Object.keys(s.invest) as (keyof Story['invest'])[]).filter((k) => !s.invest[k].ok),
    perguntas: s.perguntasRefinamento.length,
  }
}

export function scoreEpic(e: Epic, esperado: { lacunasMin: number; termos?: string[] }) {
  const ids = new Set(e.stories.map((s) => s.id))
  const idsConsistentes = e.ordemSugerida.every((id) => ids.has(id)) && e.stories.every((s) => s.dependeDe.every((d) => ids.has(d)))
  const texto = JSON.stringify({ stories: e.stories, lacunas: e.lacunas }).toLowerCase()
  return {
    historias: e.stories.length,
    lacunas: e.lacunas.length,
    atendeLacunas: e.lacunas.length >= esperado.lacunasMin,
    idsConsistentes,
    termosAusentes: (esperado.termos ?? []).filter((t) => !texto.includes(t.toLowerCase())),
    semCodigo: !JSON.stringify(e.stories).includes('```'),
  }
}
