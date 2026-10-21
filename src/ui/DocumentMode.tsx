import { useState } from 'react'
import { AppError } from '../core/errors'
import { generateEpic } from '../core/generateEpic'
import type { Epic } from '../core/types'
import { extractText } from '../import/readFile'
import type { LlmClient } from '../llm/client'
import { EXEMPLO_DOCUMENTO } from '../llm/demoClient'
import type { Nivel } from '../prompts'
import { ErrorBanner } from './ErrorBanner'
import { EpicView } from './EpicView'

interface Props {
  client: LlmClient
  demo: boolean
  onUseDemo?: () => void
}

export function DocumentMode({ client, demo, onUseDemo }: Props) {
  const [doc, setDoc] = useState(demo ? EXEMPLO_DOCUMENTO : '')
  const [epic, setEpic] = useState<Epic | null>(null)
  const [docAnalisado, setDocAnalisado] = useState('')
  const [error, setError] = useState<AppError | null>(null)
  const [loading, setLoading] = useState(false)
  const [nivel, setNivel] = useState<Nivel>('enxuto')
  const [progresso, setProgresso] = useState<{ feitas: number; total: number } | null>(null)

  // Ao sair do modo demo, o exemplo que ninguém editou não deve ficar no lugar do documento do usuário.
  const [demoAnterior, setDemoAnterior] = useState(demo)
  if (demo !== demoAnterior) {
    setDemoAnterior(demo)
    if (!demo && doc === EXEMPLO_DOCUMENTO) setDoc('')
  }

  async function analisar() {
    setLoading(true)
    setError(null)
    setEpic(null)
    setProgresso(null)
    const analisado = doc
    const r = await generateEpic(doc, client, (feitas, total) => setProgresso({ feitas, total }), { nivel })
    setLoading(false)
    setProgresso(null)
    if (r.ok) {
      setEpic(r.value)
      setDocAnalisado(analisado)
    } else setError(r.error)
  }

  async function importar(file: File | undefined) {
    if (!file) return
    setError(null)
    try {
      setDoc(await extractText(file))
    } catch (e) {
      if (e instanceof AppError) setError(e)
      else throw e
    }
  }

  return (
    <section>
      <div className="campo">
        <label htmlFor="documento">Documento de requisitos</label>
        <textarea id="documento" rows={12} value={doc} onChange={(e) => setDoc(e.target.value)} />
        {demo && <small>Modo demo: o resultado é um exemplo pré-gerado sobre um documento fictício.</small>}
      </div>
      <div className="campo">
        <label htmlFor="arquivo">Importar arquivo (.pdf, .docx, .md ou .txt)</label>
        <input id="arquivo" type="file" accept=".pdf,.docx,.md,.txt" onChange={(e) => importar(e.target.files?.[0])} />
      </div>
      <div className="campo">
        <label htmlFor="nivel">Nível de detalhe</label>
        <select id="nivel" value={nivel} onChange={(e) => setNivel(e.target.value as Nivel)}>
          <option value="enxuto">Enxuto: de 12 a 20 histórias, agrupadas por fluxo</option>
          <option value="completo">Completo: histórias bem finas, todos os cenários</option>
        </select>
        <small>O modo enxuto é mais rápido e mais fácil de planejar; o completo detalha cada campo e regra separadamente.</small>
      </div>
      <button type="button" onClick={analisar} disabled={loading}>
        {loading ? 'Analisando…' : 'Analisar documento'}
      </button>
      {loading && (
        <p role="status" className="progresso">
          {progresso ? `${progresso.feitas} de ${progresso.total} histórias detalhadas` : 'Analisando o documento…'}
        </p>
      )}

      {error && <ErrorBanner error={error} onRetry={analisar} onUseDemo={onUseDemo} />}
      {epic && <EpicView epic={epic} onChange={setEpic} documento={docAnalisado} />}
    </section>
  )
}
