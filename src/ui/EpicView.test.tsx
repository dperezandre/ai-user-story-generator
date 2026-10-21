import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EpicView } from './EpicView'
import { historia } from '../core/fixtures'
import type { Epic } from '../core/types'

const epic: Epic = {
  titulo: 'Épico de teste',
  objetivo: 'o',
  justificativa: 'j',
  areasImpactadas: [],
  stories: [historia('H1', { quero: 'cadastrar o procedimento unificado com nome e classe', origem: 'cadastro' })],
  lacunas: [],
  ordemSugerida: ['H1'],
}

describe('EpicView', () => {
  it('lista os trechos do documento sem cobertura das histórias', () => {
    const documento = [
      'O usuário deve cadastrar o procedimento unificado com nome e classe.',
      'Relatório mensal de faturamento enviado automaticamente para a diretoria financeira.',
    ].join('\n')
    render(<EpicView epic={epic} onChange={() => {}} documento={documento} />)

    const painel = screen.getByRole('region', { name: /trechos do documento sem história/i })
    expect(within(painel).getByText(/Relatório mensal de faturamento/)).toBeInTheDocument()
    expect(within(painel).queryByText(/cadastrar o procedimento unificado/)).not.toBeInTheDocument()
    expect(within(painel).getByText(/1 de 2 linhas/i)).toBeInTheDocument()
  })

  it('avisa quando todos os trechos estão cobertos', () => {
    render(<EpicView epic={epic} onChange={() => {}} documento="O usuário deve cadastrar o procedimento unificado com nome e classe." />)
    expect(screen.getByRole('region', { name: /trechos do documento sem história/i })).toHaveTextContent(/nenhum trecho/i)
  })

  it('não mostra o painel quando não há documento', () => {
    render(<EpicView epic={epic} onChange={() => {}} />)
    expect(screen.queryByRole('region', { name: /trechos do documento sem história/i })).not.toBeInTheDocument()
  })
})
