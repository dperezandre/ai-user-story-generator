import type { Story } from './types'

export const historiaValida: Story = {
  id: 'H1',
  titulo: 'Ativar a funcionalidade por unidade',
  persona: 'administrador',
  quero: 'ligar ou desligar a funcionalidade por unidade',
  para: 'controlar a liberação gradual',
  dependeDe: [],
  origem: 'Requisito 1',
  criteriosAceite: [{ dado: 'uma unidade cadastrada', quando: 'ligo a chave', entao: 'a funcionalidade fica ativa' }],
  invest: {
    independente: { ok: true, comentario: 'ok' },
    negociavel: { ok: true, comentario: 'ok' },
    valiosa: { ok: true, comentario: 'ok' },
    estimavel: { ok: true, comentario: 'ok' },
    pequena: { ok: true, comentario: 'ok' },
    testavel: { ok: true, comentario: 'ok' },
  },
  perguntasRefinamento: ['Quem pode ligar a chave?'],
  sugestaoQuebra: null,
}

export function historia(id: string, extra: Partial<Story> = {}): Story {
  return { ...historiaValida, id, titulo: `Historia ${id}`, ...extra }
}
