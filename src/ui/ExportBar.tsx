import { useState } from 'react'
import { azureClipboardHtml, azureClipboardText, type AzureDevOpsItem } from '../export/azure'

interface Props {
  markdown: string
  azure?: AzureDevOpsItem
}

export function ExportBar({ markdown, azure }: Props) {
  const [copiado, setCopiado] = useState<string | null>(null)

  function avisar(nome: string) {
    setCopiado(nome)
    setTimeout(() => setCopiado(null), 2000)
  }

  async function copiarMarkdown() {
    await navigator.clipboard.writeText(markdown)
    avisar('Markdown')
  }

  async function copiarAzure(item: AzureDevOpsItem) {
    const texto = azureClipboardText(item)
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
      // HTML rico: cola formatado nos campos Description e Acceptance Criteria do Azure DevOps/Jira
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([azureClipboardHtml(item)], { type: 'text/html' }),
          'text/plain': new Blob([texto], { type: 'text/plain' }),
        }),
      ])
    } else {
      await navigator.clipboard.writeText(texto)
    }
    avisar('Azure DevOps')
  }

  return (
    <div className="exportar">
      <button type="button" onClick={copiarMarkdown}>
        Copiar Markdown
      </button>
      {azure && (
        <button type="button" onClick={() => copiarAzure(azure)}>
          Copiar para Azure DevOps
        </button>
      )}
      {copiado && <span role="status">Copiado: {copiado}</span>}
    </div>
  )
}
