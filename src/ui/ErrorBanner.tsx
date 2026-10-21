import type { AppError } from '../core/errors'

interface Props {
  error: AppError
  onRetry?: () => void
  onUseDemo?: () => void
}

const PODE_TENTAR_DE_NOVO = ['rede', 'limite', 'formato']

export function ErrorBanner({ error, onRetry, onUseDemo }: Props) {
  return (
    <div role="alert" className="erro">
      <p>{error.message}</p>
      {error.kind === 'chave-invalida' && onUseDemo && (
        <button type="button" onClick={onUseDemo}>
          Usar modo demo
        </button>
      )}
      {PODE_TENTAR_DE_NOVO.includes(error.kind) && onRetry && (
        <button type="button" onClick={onRetry}>
          Tentar de novo
        </button>
      )}
      {error.kind === 'formato' && error.raw && (
        <details>
          <summary>Ver resposta bruta da IA</summary>
          <pre>{error.raw}</pre>
        </details>
      )}
    </div>
  )
}
