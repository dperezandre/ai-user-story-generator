import type { RelatorioCobertura } from '../core/coverage'

export function CoberturaPanel({ relatorio }: { relatorio: RelatorioCobertura }) {
  const { total, fracos } = relatorio
  return (
    <section aria-label="Trechos do documento sem história" className="cobertura">
      <h3>Trechos do documento sem história ({fracos.length})</h3>
      <small>
        Checagem aproximada por palavras, sem IA: {fracos.length} de {total} linhas do documento aparecem pouco nas histórias e lacunas.
        Use para conferir o que pode ter ficado de fora; muitas são só texto de introdução.
      </small>
      {fracos.length === 0 ? (
        <p>Nenhum trecho com pouca cobertura.</p>
      ) : (
        <ul>
          {fracos.map((f, i) => (
            <li key={i}>
              {f.linha} <span className="percentual">({Math.round(f.cobertura * 100)}% coberto)</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
