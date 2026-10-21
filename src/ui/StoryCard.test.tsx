import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StoryCard } from './StoryCard'
import { historiaValida } from '../core/fixtures'

describe('StoryCard', () => {
  it('edita as perguntas de refinamento, uma por linha, ao sair do campo', () => {
    const onChange = vi.fn()
    render(<StoryCard story={historiaValida} onChange={onChange} />)
    const campo = screen.getByLabelText('Perguntas de refinamento')
    fireEvent.change(campo, { target: { value: 'primeira\n\nsegunda' } })
    fireEvent.blur(campo)
    expect(onChange).toHaveBeenCalledWith({ ...historiaValida, perguntasRefinamento: ['primeira', 'segunda'] })
  })

  it('edita a sugestão de quebra e esvaziar o campo vira null', () => {
    const onChange = vi.fn()
    render(<StoryCard story={{ ...historiaValida, sugestaoQuebra: ['parte A'] }} onChange={onChange} />)
    const campo = screen.getByLabelText('Sugestão de quebra')
    fireEvent.change(campo, { target: { value: 'parte A\nparte B' } })
    fireEvent.blur(campo)
    expect(onChange).toHaveBeenLastCalledWith({ ...historiaValida, sugestaoQuebra: ['parte A', 'parte B'] })
    fireEvent.change(campo, { target: { value: '' } })
    fireEvent.blur(campo)
    expect(onChange).toHaveBeenLastCalledWith({ ...historiaValida, sugestaoQuebra: null })
  })

  it('oferece exportação da própria história', () => {
    render(<StoryCard story={historiaValida} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /copiar markdown/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copiar para azure devops/i })).toBeInTheDocument()
  })
})
