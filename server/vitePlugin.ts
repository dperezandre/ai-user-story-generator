import type { Plugin } from 'vite'
import { criarClient } from '../scripts/provider'
import { localAiHandler } from './localAi'

/** Liga a IA local (Claude Code) em `vite` e `vite preview`. No build publicado (GitHub Pages) não existe: o app cai no modo demo. */
export function localAi(): Plugin {
  const montar = () => {
    const { client, disponivel } = criarClient()
    return localAiHandler({ client, disponivel })
  }
  return {
    name: 'ia-local',
    configureServer: (server) => void server.middlewares.use(montar()),
    configurePreviewServer: (server) => void server.middlewares.use(montar()),
  }
}
