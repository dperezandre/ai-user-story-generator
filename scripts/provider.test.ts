// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { criarClient } from './provider'

afterEach(() => vi.unstubAllEnvs())

describe('criarClient', () => {
  it('com ANTHROPIC_API_KEY usa a API e está disponível', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-teste')
    const r = criarClient()
    expect(r.origem).toBe('API da Anthropic')
    expect(r.disponivel).toBe(true)
  })

  it('sem chave e com o Claude Code instalado, usa o Claude Code', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    vi.stubEnv('CLAUDE_BIN', process.execPath)
    const r = criarClient()
    expect(r.origem).toContain('Claude Code')
    expect(r.disponivel).toBe(true)
  })

  it('sem chave e sem o Claude Code instalado, fica indisponível', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    vi.stubEnv('CLAUDE_BIN', 'C:\\nao\\existe\\claude.exe')
    expect(criarClient().disponivel).toBe(false)
  })
})
