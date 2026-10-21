import { describe, it, expect } from 'vitest'
import { CliClient, type Runner } from './cliClient'
import { AppError } from '../src/core/errors'

const req = { kind: 'curto' as const, system: 'SISTEMA DE PO', user: 'texto do usuário' }

describe('CliClient', () => {
  it('chama o claude em modo -p com o system prompt, sem ferramentas, e manda o pedido pela entrada padrão', async () => {
    let args: string[] = []
    let entrada = ''
    const run: Runner = async (a, input) => {
      args = a
      entrada = input
      return { code: 0, stdout: '  {"ok":true}\n', stderr: '' }
    }
    const texto = await new CliClient(run, 'modelo-x').complete(req)

    expect(texto).toBe('{"ok":true}')
    expect(entrada).toBe('texto do usuário')
    expect(args).toContain('-p')
    expect(args[args.indexOf('--system-prompt') + 1]).toBe('SISTEMA DE PO')
    expect(args[args.indexOf('--tools') + 1]).toBe('')
    expect(args).toContain('--no-session-persistence')
    expect(args[args.indexOf('--model') + 1]).toBe('modelo-x')
  })

  it('transforma saída com código diferente de zero em erro tipado de rede', async () => {
    const run: Runner = async () => ({ code: 1, stdout: '', stderr: 'not logged in' })
    const e = await new CliClient(run).complete(req).catch((x) => x)
    expect(e).toBeInstanceOf(AppError)
    expect(e.kind).toBe('rede')
    expect(e.message).toContain('not logged in')
  })

  it('não passa --model quando nenhum modelo é informado', async () => {
    let args: string[] = []
    const run: Runner = async (a) => {
      args = a
      return { code: 0, stdout: 'x', stderr: '' }
    }
    await new CliClient(run).complete(req)
    expect(args).not.toContain('--model')
  })
})
