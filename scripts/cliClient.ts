import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { AppError } from '../src/core/errors'
import type { LlmClient, LlmRequest } from '../src/llm/client'

export type Runner = (args: string[], input: string) => Promise<{ code: number; stdout: string; stderr: string }>

/** Executa o binário do Claude Code a partir de uma pasta neutra, para não carregar contexto de nenhum projeto. */
export const spawnRunner =
  (bin: string): Runner =>
  (args, input) =>
    new Promise((resolve, reject) => {
      const p = spawn(bin, args, { cwd: tmpdir(), windowsHide: true })
      let stdout = ''
      let stderr = ''
      p.stdout.on('data', (d) => (stdout += d))
      p.stderr.on('data', (d) => (stderr += d))
      p.on('error', reject)
      p.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }))
      p.stdin.end(input)
    })

/**
 * LlmClient que usa o Claude Code instalado (login da própria pessoa), sem chave de API.
 * Serve aos scripts de geração do demo e de avaliação; o app no navegador usa ClaudeClient.
 */
export class CliClient implements LlmClient {
  constructor(
    private readonly run: Runner,
    private readonly model?: string,
  ) {}

  async complete(req: LlmRequest): Promise<string> {
    const args = ['-p', '--system-prompt', req.system, '--tools', '', '--no-session-persistence', '--disable-slash-commands']
    if (this.model) args.push('--model', this.model)

    const { code, stdout, stderr } = await this.run(args, req.user)
    if (code !== 0) {
      throw new AppError('rede', `O Claude Code terminou com erro (${code}): ${stderr.trim() || stdout.trim() || 'sem detalhes'}`)
    }
    return stdout.trim()
  }
}
