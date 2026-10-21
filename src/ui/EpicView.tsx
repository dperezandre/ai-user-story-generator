import { useMemo } from 'react'
import { trechosSemHistoria } from '../core/coverage'
import type { Epic, Story } from '../core/types'
import { epicToMarkdown } from '../export/markdown'
import { CoberturaPanel } from './CoberturaPanel'
import { ExportBar } from './ExportBar'
import { LacunasPanel } from './LacunasPanel'
import { StoryCard } from './StoryCard'

interface Props {
  epic: Epic
  onChange: (epic: Epic) => void
  /** Texto do documento que originou o épico; habilita o painel de trechos sem história. */
  documento?: string
}

export function EpicView({ epic, onChange, documento }: Props) {
  const cobertura = useMemo(() => (documento ? trechosSemHistoria(documento, epic) : null), [documento, epic])
  const atualiza = (nova: Story) => onChange({ ...epic, stories: epic.stories.map((s) => (s.id === nova.id ? nova : s)) })

  return (
    <div className="epico">
      <h2>{epic.titulo}</h2>
      <p>
        <strong>Objetivo:</strong> {epic.objetivo}
      </p>
      <p>
        <strong>Justificativa:</strong> {epic.justificativa}
      </p>
      <p>
        <strong>Áreas impactadas:</strong> {epic.areasImpactadas.join(', ') || '—'}
      </p>
      <p>
        <strong>Ordem sugerida de entrega:</strong> {epic.ordemSugerida.join(' → ')}
      </p>

      <ExportBar markdown={epicToMarkdown(epic)} />
      <LacunasPanel lacunas={epic.lacunas} />
      {cobertura && <CoberturaPanel relatorio={cobertura} />}

      <h3>Histórias ({epic.stories.length})</h3>
      {epic.stories.map((s) => (
        <StoryCard key={s.id} story={s} onChange={atualiza} />
      ))}
    </div>
  )
}
