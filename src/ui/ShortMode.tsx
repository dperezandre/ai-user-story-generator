import { useState } from 'react'
import { generateStory } from '../core/generateStory'
import type { AppError } from '../core/errors'
import type { Story } from '../core/types'
import type { LlmClient } from '../llm/client'
import { EXEMPLO_CURTO } from '../llm/demoClient'
import { ErrorBanner } from './ErrorBanner'
import { StoryCard } from './StoryCard'

interface Props {
  client: LlmClient
  demo: boolean
  onUseDemo?: () => void
}

export function ShortMode({ client, demo, onUseDemo }: Props) {
  const [need, setNeed] = useState(demo ? EXEMPLO_CURTO : '')
  const [story, setStory] = useState<Story | null>(null)
  const [error, setError] = useState<AppError | null>(null)
  const [loading, setLoading] = useState(false)

  // Ao sair do modo demo, o exemplo que ninguém editou não deve ficar no lugar do texto do usuário.
  const [demoAnterior, setDemoAnterior] = useState(demo)
  if (demo !== demoAnterior) {
    setDemoAnterior(demo)
    if (!demo && need === EXEMPLO_CURTO) setNeed('')
  }

  async function gerar() {
    setLoading(true)
    setError(null)
    const r = await generateStory(need, client)
    setLoading(false)
    if (r.ok) setStory(r.value)
    else {
      setStory(null)
      setError(r.error)
    }
  }

  return (
    <section>
      <div className="campo">
        <label htmlFor="necessidade">Necessidade</label>
        <textarea id="necessidade" rows={5} value={need} onChange={(e) => setNeed(e.target.value)} />
        {demo && <small>Modo demo: o resultado é um exemplo pré-gerado, independente do texto digitado.</small>}
      </div>
      <button type="button" onClick={gerar} disabled={loading}>
        {loading ? 'Gerando…' : 'Gerar história'}
      </button>

      {error && <ErrorBanner error={error} onRetry={gerar} onUseDemo={onUseDemo} />}
      {story && <StoryCard story={story} onChange={setStory} />}
    </section>
  )
}
