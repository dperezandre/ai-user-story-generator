import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('mostra o título do projeto, o aviso de dados sensíveis e o selo de modo demo', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /gerador de histórias/i })).toBeInTheDocument()
    expect(screen.getByText(/não cole dados sensíveis/i)).toBeInTheDocument()
    expect(screen.getByText(/^\s*modo demo\s*$/i)).toBeInTheDocument()
  })

  it('trocar de aba e voltar preserva o texto digitado', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText(/documento de requisitos/i), ' EXTRA')
    await user.click(screen.getByRole('tab', { name: /história curta/i }))
    await user.click(screen.getByRole('tab', { name: /documento de requisitos/i }))
    expect((screen.getByLabelText(/documento de requisitos/i) as HTMLTextAreaElement).value).toContain('EXTRA')
  })

  it('apagar a chave não descarta o que o usuário já digitou', async () => {
    const user = userEvent.setup()
    render(<App />)
    const chave = screen.getByLabelText(/chave da api/i)
    await user.type(chave, 'sk-ant-x')
    await user.type(screen.getByLabelText(/documento de requisitos/i), ' EXTRA2')
    await user.clear(chave)
    expect((screen.getByLabelText(/documento de requisitos/i) as HTMLTextAreaElement).value).toContain('EXTRA2')
  })

  it('com a IA local disponível, mostra o selo "IA local" e não o de modo demo', async () => {
    render(<App sondarIaLocal={async () => true} />)
    expect(await screen.findByText(/^\s*ia local\s*$/i)).toBeInTheDocument()
    expect(screen.queryByText(/^\s*modo demo\s*$/i)).not.toBeInTheDocument()
  })

  it('ao informar uma chave, o selo de modo demo some', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText(/chave da api/i), 'sk-ant-teste')
    expect(screen.queryByText(/^modo demo$/i)).not.toBeInTheDocument()
  })
})
