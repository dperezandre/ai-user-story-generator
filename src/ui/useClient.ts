import { useEffect, useMemo, useState } from 'react'
import { ClaudeClient } from '../llm/claudeClient'
import { DemoClient } from '../llm/demoClient'
import { LocalClient, localAiDisponivel } from '../llm/localClient'
import type { LlmClient } from '../llm/client'

export type Modo = 'chave' | 'local' | 'demo'

/**
 * Escolhe a IA: chave informada > IA local (Claude Code, quando o servidor do app a oferece) > modo demo.
 * `demo` é true só no modo demo, em que o resultado é um exemplo pré-gerado.
 */
export function useClient(apiKey: string, sondar: () => Promise<boolean> = localAiDisponivel): { client: LlmClient; demo: boolean; modo: Modo } {
  const chave = apiKey.trim()
  const [local, setLocal] = useState(false)

  useEffect(() => {
    if (chave) return
    let ativo = true
    void sondar().then((ok) => ativo && setLocal(ok))
    return () => {
      ativo = false
    }
  }, [chave, sondar])

  return useMemo(() => {
    if (chave) return { client: new ClaudeClient(chave), demo: false, modo: 'chave' as const }
    if (local) return { client: new LocalClient(), demo: false, modo: 'local' as const }
    return { client: new DemoClient(), demo: true, modo: 'demo' as const }
  }, [chave, local])
}
