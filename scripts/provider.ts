import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { ClaudeClient, DEFAULT_MODEL } from '../src/llm/claudeClient'
import type { LlmClient } from '../src/llm/client'
import { CliClient, spawnRunner } from './cliClient'

/**
 * Escolhe como os scripts e o servidor local falam com a IA:
 * - com ANTHROPIC_API_KEY: API direta;
 * - sem chave: Claude Code instalado (login da pessoa), em CLAUDE_BIN ou ~/.local/bin/claude.exe.
 * `disponivel` é false quando o Claude Code não foi encontrado.
 */
export function criarClient(): { client: LlmClient; origem: string; disponivel: boolean } {
  const chave = process.env.ANTHROPIC_API_KEY
  if (chave) return { client: new ClaudeClient(chave), origem: 'API da Anthropic', disponivel: true }
  const bin = process.env.CLAUDE_BIN || join(homedir(), '.local', 'bin', 'claude.exe')
  return { client: new CliClient(spawnRunner(bin), DEFAULT_MODEL), origem: `Claude Code (${bin})`, disponivel: existsSync(bin) }
}
