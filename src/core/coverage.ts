import type { Epic } from './types'

export interface TrechoFraco {
  linha: string
  /** Fração das palavras da linha que aparecem na história ou lacuna que mais a cobre (0 a 1). */
  cobertura: number
}

export interface RelatorioCobertura {
  /** Linhas do documento analisadas (sem repetições, curtas ou de preenchimento). */
  total: number
  /** Linhas com pouca cobertura, da menos para a mais coberta. */
  fracos: TrechoFraco[]
}

const LIMITE_COBERTURA = 0.45
const MIN_CARACTERES_LINHA = 40
const MIN_PALAVRAS = 3

const PALAVRAS_COMUNS = new Set(
  `para deve devem devera podera sera serao como esta estao este esse essa pelo pela pelos pelas dos das uma com que por sao nao
   tela telas sistema campo mais quando entao dado sobre todos todas cada qualquer mesmo mesma onde tambem entre apos antes ainda
   caso sendo forma ser ter seu sua seus suas`.split(/\s+/),
)

function palavras(texto: string): Set<string> {
  const normalizado = texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  return new Set((normalizado.match(/[a-z0-9]{4,}/g) ?? []).filter((p) => !PALAVRAS_COMUNS.has(p)))
}

function textoDaHistoria(s: Epic['stories'][number]): string {
  const criterios = s.criteriosAceite.map((c) => `${c.dado} ${c.quando} ${c.entao}`).join(' ')
  return `${s.titulo} ${s.quero} ${s.para} ${s.origem} ${criterios}`
}

/**
 * Checagem aproximada, sem IA: para cada linha do documento, vê se suas palavras aparecem em alguma história
 * (título, texto, origem e critérios) ou em alguma lacuna. Serve para o PO conferir o que pode ter ficado de fora,
 * não como garantia de cobertura.
 */
export function trechosSemHistoria(documento: string, epic: Epic): RelatorioCobertura {
  const fontes = [...epic.stories.map(textoDaHistoria), ...epic.lacunas.map((l) => `${l.trecho} ${l.problema}`)].map(palavras)

  const vistas = new Set<string>()
  const fracos: TrechoFraco[] = []
  let total = 0

  for (const bruta of documento.split('\n')) {
    const linha = bruta.trim()
    if (linha.length < MIN_CARACTERES_LINHA || linha.includes('___')) continue
    const chave = linha.toLowerCase()
    if (vistas.has(chave)) continue
    vistas.add(chave)

    const alvo = palavras(linha)
    if (alvo.size < MIN_PALAVRAS) continue
    total++

    const cobertura = Math.max(0, ...fontes.map((f) => [...alvo].filter((p) => f.has(p)).length / alvo.size))
    if (cobertura < LIMITE_COBERTURA) fracos.push({ linha, cobertura: Math.round(cobertura * 100) / 100 })
  }

  return { total, fracos: fracos.sort((a, b) => a.cobertura - b.cobertura) }
}
