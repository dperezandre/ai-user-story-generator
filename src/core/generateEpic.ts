import { err, ok, type Result } from './errors'
import { MIN_NEED_CHARS } from './generateStory'
import { AnaliseSchema, StorySchema, type Analise, type Epic, type Story } from './types'
import { completeValidated } from './validated'
import { systemPara, type Nivel } from '../prompts'
import type { LlmClient } from '../llm/client'

export const MAX_DOC_CHARS = 30000
const ANALISE_MAX_TOKENS = 12000
export const CONCORRENCIA_PADRAO = 4

export interface OpcoesEpic {
  /** 'enxuto' (padrão): 12 a 20 histórias agrupadas; 'completo': histórias finas e todos os cenários. */
  nivel?: Nivel
  /** Quantas histórias detalhar ao mesmo tempo. */
  concorrencia?: number
}

type Candidata = Analise['historias'][number]

function sanear(a: Analise): Result<{ candidatas: Candidata[]; ordem: string[] }> {
  const ids = a.historias.map((h) => h.id)
  if (new Set(ids).size !== ids.length) {
    return err('formato', 'A análise devolveu histórias com ids repetidos. Tente novamente.')
  }
  const validos = new Set(ids)
  const candidatas = a.historias.map((h) => ({ ...h, dependeDe: h.dependeDe.filter((d) => validos.has(d) && d !== h.id) }))
  const ordem = [...new Set(a.ordemSugerida.filter((id) => validos.has(id)))]
  for (const id of ids) if (!ordem.includes(id)) ordem.push(id)
  return ok({ candidatas, ordem })
}

function pedidoDeDetalhe(a: Analise, h: Candidata): string {
  return [
    `Épico: ${a.titulo}`,
    `Objetivo: ${a.objetivo}`,
    `Justificativa: ${a.justificativa}`,
    '',
    `ID: ${h.id}`,
    `Título: ${h.titulo}`,
    `Resumo: ${h.resumo}`,
    `Depende de: ${h.dependeDe.join(', ') || 'nenhuma'}`,
    `Trecho de origem: ${h.origem}`,
  ].join('\n')
}

export async function generateEpic(
  doc: string,
  client: LlmClient,
  onProgress?: (feitas: number, total: number) => void,
  { nivel = 'enxuto', concorrencia = CONCORRENCIA_PADRAO }: OpcoesEpic = {},
): Promise<Result<Epic>> {
  const texto = doc.trim()
  if (texto.length < MIN_NEED_CHARS) {
    return err('entrada', 'Cole ou importe o documento de requisitos para analisar.')
  }
  if (texto.length > MAX_DOC_CHARS) {
    return err('documento-grande', `O documento tem mais de ${MAX_DOC_CHARS} caracteres. Divida-o em partes menores.`)
  }

  const analise = await completeValidated(client, { kind: 'analise', system: systemPara('analise', nivel), user: texto, maxTokens: ANALISE_MAX_TOKENS }, AnaliseSchema)
  if (!analise.ok) return analise
  const saneada = sanear(analise.value)
  if (!saneada.ok) return saneada
  const { candidatas, ordem } = saneada.value

  // Detalha várias histórias ao mesmo tempo. A primeira falha interrompe o início de novas histórias e vira o resultado.
  const detalhadas = new Map<string, Story>()
  const fila = [...candidatas]
  let falha: Result<never> | null = null
  const trabalhador = async () => {
    for (let h = fila.shift(); h && !falha; h = fila.shift()) {
      const r = await completeValidated(
        client,
        { kind: 'detalhe', system: systemPara('detalhe', nivel), user: pedidoDeDetalhe(analise.value, h) },
        StorySchema,
      )
      if (!r.ok) {
        falha ??= r
        return
      }
      detalhadas.set(h.id, { ...r.value, id: h.id, origem: h.origem, dependeDe: h.dependeDe })
      onProgress?.(detalhadas.size, candidatas.length)
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concorrencia, candidatas.length)) }, trabalhador))
  if (falha) return falha

  const a = analise.value
  return ok({
    titulo: a.titulo,
    objetivo: a.objetivo,
    justificativa: a.justificativa,
    areasImpactadas: a.areasImpactadas,
    stories: ordem.map((id) => detalhadas.get(id)!),
    lacunas: a.lacunas,
    ordemSugerida: ordem,
  })
}
