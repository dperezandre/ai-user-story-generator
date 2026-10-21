import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ShortMode } from './ShortMode'
import { DemoClient, EXEMPLO_CURTO } from '../llm/demoClient'
import type { LlmClient } from '../llm/client'
import curtoDemo from '../llm/demo-data/curto.json'

describe('ShortMode', () => {
  it('em modo demo mostra o exemplo pré-carregado e a história da fixture ao gerar', async () => {
    const user = userEvent.setup()
    render(<ShortMode client={new DemoClient()} demo />)

    expect(screen.getByLabelText(/necessidade/i)).toHaveValue(EXEMPLO_CURTO)
    await user.click(screen.getByRole('button', { name: /gerar história/i }))

    expect(await screen.findByDisplayValue(curtoDemo.titulo)).toBeInTheDocument()
  })

  it('ao sair do modo demo, limpa o exemplo que não foi editado', () => {
    const client = new DemoClient()
    const { rerender } = render(<ShortMode client={client} demo />)
    expect(screen.getByLabelText(/necessidade/i)).toHaveValue(EXEMPLO_CURTO)
    rerender(<ShortMode client={client} demo={false} />)
    expect(screen.getByLabelText(/necessidade/i)).toHaveValue('')
  })

  it('copia o Markdown refletindo a edição feita no campo "Quero"', async () => {
    const user = userEvent.setup()
    const copiar = vi.spyOn(navigator.clipboard, 'writeText')
    render(<ShortMode client={new DemoClient()} demo />)
    await user.click(screen.getByRole('button', { name: /gerar história/i }))

    const quero = await screen.findByLabelText('Quero')
    await user.clear(quero)
    await user.type(quero, 'reutilizar protocolos aprovados')
    await user.click(screen.getByRole('button', { name: /copiar markdown/i }))

    await waitFor(() => expect(copiar).toHaveBeenCalled())
    expect(copiar.mock.calls[0][0]).toContain('quero reutilizar protocolos aprovados')
    expect(await screen.findByRole('status')).toHaveTextContent(/copiado: markdown/i)
  })

  it('entrada curta demais mostra o erro e não chama o cliente', async () => {
    const user = userEvent.setup()
    const client: LlmClient = { complete: vi.fn() }
    render(<ShortMode client={client} demo={false} />)

    await user.type(screen.getByLabelText(/necessidade/i), 'curta')
    await user.click(screen.getByRole('button', { name: /gerar história/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/pelo menos/i)
    expect(client.complete).not.toHaveBeenCalled()
  })

  it('com erro de chave inválida oferece o modo demo', async () => {
    const user = userEvent.setup()
    const { AppError } = await import('../core/errors')
    const client: LlmClient = { complete: vi.fn().mockRejectedValue(new AppError('chave-invalida', 'recusada')) }
    const aoUsarDemo = vi.fn()
    render(<ShortMode client={client} demo={false} onUseDemo={aoUsarDemo} />)

    await user.type(screen.getByLabelText(/necessidade/i), 'Uma necessidade com tamanho suficiente')
    await user.click(screen.getByRole('button', { name: /gerar história/i }))
    await user.click(await screen.findByRole('button', { name: /usar modo demo/i }))

    expect(aoUsarDemo).toHaveBeenCalledOnce()
  })
})
