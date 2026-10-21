import { useState } from 'react'
import type { Lacuna } from '../core/types'

export function LacunasPanel({ lacunas }: { lacunas: Lacuna[] }) {
  const [copiado, setCopiado] = useState(false)

  async function copiarPerguntas() {
    await navigator.clipboard.writeText(lacunas.map((l, i) => `${i + 1}. ${l.pergunta}`).join('\n'))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <section aria-label="Lacunas e ambiguidades" className="lacunas">
      <h3>Lacunas e ambiguidades ({lacunas.length})</h3>
      {lacunas.length === 0 ? (
        <p>Nenhuma lacuna encontrada.</p>
      ) : (
        <>
          <ul>
            {lacunas.map((l, i) => (
              <li key={i}>
                <blockquote>{l.trecho}</blockquote>
                <p>
                  <strong>Problema:</strong> {l.problema}
                </p>
                <p>
                  <strong>Pergunta para o negócio:</strong> {l.pergunta}
                </p>
              </li>
            ))}
          </ul>
          <button type="button" onClick={copiarPerguntas}>
            Copiar perguntas
          </button>
          {copiado && <span role="status"> Copiado: perguntas</span>}
        </>
      )}
    </section>
  )
}
