// Gera as fixtures do modo demo rodando o fluxo real com a IA. Uso:
//   npm run gerar-demo                 (usa o Claude Code instalado, sem chave de API)
//   ANTHROPIC_API_KEY=sk-ant-... npm run gerar-demo   (usa a API direta)
// Depois, REVISE os JSON gerados em src/llm/demo-data/ antes de commitar.
import { readFileSync, writeFileSync } from 'node:fs'
import type { LlmClient, LlmRequest } from '../src/llm/client'
import { extractJson } from '../src/core/json'
import { generateEpic } from '../src/core/generateEpic'
import { generateStory } from '../src/core/generateStory'
import { criarClient } from './provider'

const saida = new URL('../src/llm/demo-data/', import.meta.url)
const ler = (nome: string) => readFileSync(new URL(`../examples/${nome}`, import.meta.url), 'utf-8').trim()

const { client: real, origem } = criarClient()
console.log(`Gerando com: ${origem}`)
let curto: unknown
let analise: unknown
const detalhes: Record<string, unknown> = {}

const gravador: LlmClient = {
  async complete(req: LlmRequest) {
    const texto = await real.complete(req)
    const json = extractJson(texto) as { id?: string }
    if (req.kind === 'curto') curto = json
    else if (req.kind === 'analise') analise = json
    else if (json.id) detalhes[json.id] = json
    return texto
  },
}

const historia = await generateStory(ler('necessidade-curta.md'), gravador)
if (!historia.ok) throw historia.error
const epico = await generateEpic(ler('documento-rede-vita.md'), gravador, (f, t) => console.log(`história ${f}/${t}`))
if (!epico.ok) throw epico.error

const gravar = (nome: string, dado: unknown) => writeFileSync(new URL(nome, saida), JSON.stringify(dado, null, 2) + '\n')
gravar('curto.json', curto)
gravar('analise.json', analise)
gravar('detalhes.json', detalhes)
console.log(`Fixtures gravadas. Lacunas detectadas: ${epico.value.lacunas.length}. REVISE os arquivos antes de commitar.`)
