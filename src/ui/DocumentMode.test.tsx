import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DocumentMode } from './DocumentMode'
import { DemoClient, EXEMPLO_DOCUMENTO } from '../llm/demoClient'
import { AppError } from '../core/errors'
import { MAX_DOC_CHARS } from '../core/generateEpic'
import { historia } from '../core/fixtures'
import type { LlmClient } from '../llm/client'
import analiseDemo from '../llm/demo-data/analise.json'

const analise3 = {
  titulo: 'Épico de teste',
  objetivo: 'o',
  justificativa: 'j',
  areasImpactadas: ['A'],
  historias: ['H1', 'H2', 'H3'].map((id) => ({ id, titulo: id, resumo: 'r', origem: 'o', dependeDe: [] })),
  lacunas: [],
  ordemSugerida: ['H1', 'H2', 'H3'],
}
const DOC = 'Um documento de requisitos com tamanho suficiente para análise.'

describe('DocumentMode', () => {
  it('em modo demo mostra o épico, as histórias na ordem sugerida e as lacunas', async () => {
    const user = userEvent.setup()
    render(<DocumentMode client={new DemoClient()} demo />)

    expect(screen.getByLabelText(/documento de requisitos/i)).toHaveValue(EXEMPLO_DOCUMENTO)
    await user.click(screen.getByRole('button', { name: /analisar documento/i }))

    expect(await screen.findByRole('heading', { name: analiseDemo.titulo })).toBeInTheDocument()
    const ids = screen.getAllByText(/^H\d+$/).map((e) => e.textContent)
    expect(ids).toEqual(analiseDemo.ordemSugerida)
    const lacunas = screen.getByRole('region', { name: /lacunas/i })
    expect(within(lacunas).getAllByRole('listitem').length).toBeGreaterThanOrEqual(5)
  })

  it('ao sair do modo demo, limpa o exemplo se ele não foi editado, e mantém o texto do usuário', async () => {
    const client = new DemoClient()
    const { rerender } = render(<DocumentMode client={client} demo />)
    rerender(<DocumentMode client={client} demo={false} />)
    expect(screen.getByLabelText(/documento de requisitos/i)).toHaveValue('')

    const outro = render(<DocumentMode client={client} demo />)
    const campo = outro.getAllByLabelText(/documento de requisitos/i).at(-1)!
    fireEvent.change(campo, { target: { value: 'texto do próprio usuário' } })
    outro.rerender(<DocumentMode client={client} demo={false} />)
    expect(outro.getAllByLabelText(/documento de requisitos/i).at(-1)).toHaveValue('texto do próprio usuário')
  })

  it('o campo aceita documento de requisitos ou prompt de implementação e explica isso na dica', () => {
    render(<DocumentMode client={new DemoClient()} demo={false} />)
    expect(screen.getByLabelText(/documento de requisitos ou prompt de implementação/i)).toBeInTheDocument()
    expect(screen.getByText(/prompt de implementação.*(stack|modelagem|telas)/i)).toBeInTheDocument()
  })

  it('permite exportar cada história do épico no formato Azure DevOps', async () => {
    const user = userEvent.setup()
    render(<DocumentMode client={new DemoClient()} demo />)
    await user.click(screen.getByRole('button', { name: /analisar documento/i }))
    await screen.findByRole('heading', { name: analiseDemo.titulo })
    expect(screen.getAllByRole('button', { name: /copiar para azure devops/i })).toHaveLength(analiseDemo.historias.length)
  })

  it('o nível de detalhe vem em Enxuto e pode ser trocado para Completo', async () => {
    const user = userEvent.setup()
    const sistemasDaAnalise: string[] = []
    const client: LlmClient = {
      async complete(r) {
        if (r.kind === 'analise') {
          sistemasDaAnalise.push(r.system)
          return JSON.stringify(analise3)
        }
        return JSON.stringify(historia(/ID: (\S+)/.exec(r.user)![1]))
      },
    }
    render(<DocumentMode client={client} demo={false} />)
    fireEvent.change(screen.getByLabelText(/documento de requisitos/i), { target: { value: DOC } })

    const nivel = screen.getByLabelText(/nível de detalhe/i)
    expect(nivel).toHaveValue('enxuto')
    await user.click(screen.getByRole('button', { name: /analisar documento/i }))
    await screen.findByRole('heading', { name: 'Épico de teste' })
    expect(sistemasDaAnalise[0]).toContain('MODO ENXUTO')

    await user.selectOptions(nivel, 'completo')
    await user.click(screen.getByRole('button', { name: /analisar documento/i }))
    await waitFor(() => expect(sistemasDaAnalise).toHaveLength(2))
    expect(sistemasDaAnalise[1]).not.toContain('MODO ENXUTO')
  })

  it('mostra o progresso do detalhamento das histórias', async () => {
    const user = userEvent.setup()
    let liberar!: () => void
    const trava = new Promise<void>((r) => (liberar = r))
    let detalhes = 0
    const client: LlmClient = {
      async complete(r) {
        if (r.kind === 'analise') return JSON.stringify(analise3)
        detalhes++
        if (detalhes === 2) await trava
        return JSON.stringify(historia(/ID: (\S+)/.exec(r.user)![1]))
      },
    }
    render(<DocumentMode client={client} demo={false} />)
    fireEvent.change(screen.getByLabelText(/documento de requisitos/i), { target: { value: DOC } })
    await user.click(screen.getByRole('button', { name: /analisar documento/i }))

    expect(await screen.findByText(/2 de 3 histórias detalhadas/i)).toBeInTheDocument()
    liberar()
    expect(await screen.findByRole('heading', { name: 'Épico de teste' })).toBeInTheDocument()
  })

  it('falha de rede na segunda história mostra erro com "Tentar de novo" e nenhuma história', async () => {
    const user = userEvent.setup()
    let detalhes = 0
    const client: LlmClient = {
      async complete(r) {
        if (r.kind === 'analise') return JSON.stringify(analise3)
        if (++detalhes === 2) throw new AppError('rede', 'A conexão caiu.')
        return JSON.stringify(historia(/ID: (\S+)/.exec(r.user)![1]))
      },
    }
    render(<DocumentMode client={client} demo={false} />)
    fireEvent.change(screen.getByLabelText(/documento de requisitos/i), { target: { value: DOC } })
    await user.click(screen.getByRole('button', { name: /analisar documento/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('A conexão caiu.')
    expect(screen.getByRole('button', { name: /tentar de novo/i })).toBeInTheDocument()
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })

  it('importa um arquivo .txt para a área de texto', async () => {
    const user = userEvent.setup()
    render(<DocumentMode client={new DemoClient()} demo={false} />)
    await user.upload(screen.getByLabelText(/importar arquivo/i), new File(['conteúdo importado do arquivo'], 'req.txt'))
    await waitFor(() => expect(screen.getByLabelText(/documento de requisitos/i)).toHaveValue('conteúdo importado do arquivo'))
  })

  it('rejeita arquivo de formato não suportado com erro de entrada', async () => {
    const user = userEvent.setup({ applyAccept: false })
    render(<DocumentMode client={new DemoClient()} demo={false} />)
    await user.upload(screen.getByLabelText(/importar arquivo/i), new File(['x'], 'req.xlsx'))
    expect(await screen.findByRole('alert')).toHaveTextContent(/\.docx/)
  })

  it('documento acima do limite mostra o erro e não chama o cliente', async () => {
    const user = userEvent.setup()
    const client: LlmClient = { complete: vi.fn() }
    render(<DocumentMode client={client} demo={false} />)
    fireEvent.change(screen.getByLabelText(/documento de requisitos/i), { target: { value: 'x'.repeat(MAX_DOC_CHARS + 1) } })
    await user.click(screen.getByRole('button', { name: /analisar documento/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(String(MAX_DOC_CHARS))
    expect(client.complete).not.toHaveBeenCalled()
  })
})
