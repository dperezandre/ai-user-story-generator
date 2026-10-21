import type { Story } from '../core/types'
import { storyToAzureDevOps } from '../export/azure'
import { storyToMarkdown } from '../export/markdown'
import { ExportBar } from './ExportBar'

const linhas = (texto: string) =>
  texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

interface Props {
  story: Story
  onChange: (story: Story) => void
}

const INVEST_NOMES: Record<keyof Story['invest'], string> = {
  independente: 'Independente',
  negociavel: 'Negociável',
  valiosa: 'Valiosa',
  estimavel: 'Estimável',
  pequena: 'Pequena',
  testavel: 'Testável',
}

export function StoryCard({ story, onChange }: Props) {
  const set = <K extends keyof Story>(chave: K, valor: Story[K]) => onChange({ ...story, [chave]: valor })
  const campo = (rotulo: string, chave: 'titulo' | 'persona' | 'quero' | 'para') => {
    const id = `${story.id}-${chave}`
    return (
      <div className="campo">
        <label htmlFor={id}>{rotulo}</label>
        <textarea id={id} rows={chave === 'titulo' || chave === 'persona' ? 1 : 2} value={story[chave]} onChange={(e) => set(chave, e.target.value)} />
      </div>
    )
  }

  return (
    <article className="historia">
      <p className="id">{story.id}</p>
      {campo('Título', 'titulo')}
      {campo('Persona', 'persona')}
      {campo('Quero', 'quero')}
      {campo('Para', 'para')}

      <h4>Critérios de aceite (Gherkin)</h4>
      {story.criteriosAceite.map((c, i) => {
        const atualiza = (parte: Partial<typeof c>) =>
          set('criteriosAceite', story.criteriosAceite.map((x, j) => (j === i ? { ...x, ...parte } : x)))
        return (
          <fieldset key={i} className="cenario">
            <legend>Cenário {i + 1}</legend>
            <label>
              Dado <input aria-label={`Dado ${i + 1}`} value={c.dado} onChange={(e) => atualiza({ dado: e.target.value })} />
            </label>
            <label>
              Quando <input aria-label={`Quando ${i + 1}`} value={c.quando} onChange={(e) => atualiza({ quando: e.target.value })} />
            </label>
            <label>
              Então <input aria-label={`Então ${i + 1}`} value={c.entao} onChange={(e) => atualiza({ entao: e.target.value })} />
            </label>
          </fieldset>
        )
      })}

      <h4>Avaliação INVEST</h4>
      <ul className="invest">
        {(Object.keys(INVEST_NOMES) as (keyof Story['invest'])[]).map((k) => (
          <li key={k} className={story.invest[k].ok ? 'ok' : 'falha'}>
            <strong>
              {story.invest[k].ok ? '✓' : '✗'} {INVEST_NOMES[k]}
            </strong>
            : {story.invest[k].comentario}
          </li>
        ))}
      </ul>

      <div className="campo">
        <label htmlFor={`${story.id}-perguntas`}>Perguntas de refinamento</label>
        <textarea
          key={story.perguntasRefinamento.join('\n')}
          id={`${story.id}-perguntas`}
          rows={Math.max(2, story.perguntasRefinamento.length)}
          defaultValue={story.perguntasRefinamento.join('\n')}
          onBlur={(e) => set('perguntasRefinamento', linhas(e.target.value))}
        />
        <small>Uma por linha.</small>
      </div>
      {story.sugestaoQuebra && (
        <div className="campo">
          <label htmlFor={`${story.id}-quebra`}>Sugestão de quebra</label>
          <textarea
            key={story.sugestaoQuebra.join('\n')}
            id={`${story.id}-quebra`}
            rows={Math.max(2, story.sugestaoQuebra.length)}
            defaultValue={story.sugestaoQuebra.join('\n')}
            onBlur={(e) => set('sugestaoQuebra', linhas(e.target.value).length ? linhas(e.target.value) : null)}
          />
          <small>Uma por linha. Deixe vazio para remover.</small>
        </div>
      )}
      {story.dependeDe.length > 0 && <p className="dependencias">Depende de: {story.dependeDe.join(', ')}</p>}

      <ExportBar markdown={storyToMarkdown(story)} azure={storyToAzureDevOps(story)} />
    </article>
  )
}
