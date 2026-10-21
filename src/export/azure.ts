import type { Story } from '../core/types'

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ESCAPES[c])
}

export interface AzureDevOpsItem {
  title: string
  descriptionHtml: string
  acceptanceCriteriaHtml: string
}

export function azureClipboardHtml(item: AzureDevOpsItem): string {
  return `<h3>${escapeHtml(item.title)}</h3>${item.descriptionHtml}<p><b>Critérios de aceite</b></p>${item.acceptanceCriteriaHtml}`
}

export function azureClipboardText(item: AzureDevOpsItem): string {
  return `${item.title}\n\n${item.descriptionHtml}\n${item.acceptanceCriteriaHtml}`
}

export function storyToAzureDevOps(s: Story): AzureDevOpsItem {
  const e = escapeHtml
  return {
    title: s.titulo,
    descriptionHtml: `<p>Como <b>${e(s.persona)}</b>, quero ${e(s.quero)}, para ${e(s.para)}.</p>`,
    acceptanceCriteriaHtml:
      '<ul>' +
      s.criteriosAceite.map((c) => `<li><b>Dado</b> ${e(c.dado)} <b>Quando</b> ${e(c.quando)} <b>Então</b> ${e(c.entao)}</li>`).join('') +
      '</ul>',
  }
}
