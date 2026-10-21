// Roda os casos de evals/cases com a IA real e compara versões de prompt. Uso:
//   npm run eval                       (usa o Claude Code instalado, sem chave de API)
//   ANTHROPIC_API_KEY=sk-ant-... npm run eval   (usa a API direta)
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { DEFAULT_MODEL } from '../src/llm/claudeClient'
import { generateEpic } from '../src/core/generateEpic'
import { generateStory } from '../src/core/generateStory'
import { PROMPTS } from '../src/prompts'
import { criarClient } from '../scripts/provider'
import { scoreEpic, scoreStory } from './score'

interface Caso {
  id: string
  tipo: 'curto' | 'documento'
  entrada?: string
  arquivo?: string
  esperado: { lacunasMin?: number; gherkinMin?: number }
}

const raiz = new URL('../', import.meta.url)
const { client, origem } = criarClient()
console.log(`Avaliando com: ${origem}`)
const pasta = new URL('evals/cases/', raiz)
const casos: Caso[] = readdirSync(pasta)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(new URL(f, pasta), 'utf-8')))

const resultados: Record<string, unknown>[] = []
for (const caso of casos) {
  const entrada = caso.arquivo ? readFileSync(new URL(caso.arquivo, raiz), 'utf-8') : (caso.entrada ?? '')
  const inicio = Date.now()
  if (caso.tipo === 'curto') {
    const r = await generateStory(entrada, client)
    const score = r.ok ? scoreStory(r.value) : null
    const aprovado = !!score && score.gherkinCount >= (caso.esperado.gherkinMin ?? 2) && score.temCenarioDeErro
    resultados.push({ id: caso.id, tipo: caso.tipo, formatoValido: r.ok, aprovado, score, erro: r.ok ? null : r.error.kind, ms: Date.now() - inicio })
  } else {
    const r = await generateEpic(entrada, client)
    const score = r.ok ? scoreEpic(r.value, { lacunasMin: caso.esperado.lacunasMin ?? 0 }) : null
    const aprovado = !!score && score.atendeLacunas && score.idsConsistentes
    resultados.push({ id: caso.id, tipo: caso.tipo, formatoValido: r.ok, aprovado, score, erro: r.ok ? null : r.error.kind, ms: Date.now() - inicio })
  }
  const ultimo = resultados[resultados.length - 1]
  console.log(`${ultimo.aprovado ? 'OK  ' : 'FALHA'} ${caso.id} (${ultimo.ms} ms)`)
}

const versao = `c${PROMPTS.curto.versao}-a${PROMPTS.analise.versao}-d${PROMPTS.detalhe.versao}`
const aprovados = resultados.filter((r) => r.aprovado).length
const arquivo = new URL(`evals/results/${new Date().toISOString().slice(0, 10)}-${versao}.json`, raiz)
mkdirSync(new URL('evals/results/', raiz), { recursive: true })
writeFileSync(arquivo, JSON.stringify({ modelo: DEFAULT_MODEL, origem, versaoPrompts: versao, aprovados, total: resultados.length, resultados }, null, 2) + '\n')
console.log(`\n${aprovados}/${resultados.length} casos aprovados. Resultado salvo em evals/results/ (${versao}).`)
