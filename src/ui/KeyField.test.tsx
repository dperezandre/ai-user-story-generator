import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, it, expect } from 'vitest'
import { KeyField } from './KeyField'

function Wrapper() {
  const [v, setV] = useState('')
  return <KeyField value={v} onChange={setV} />
}

describe('KeyField', () => {
  it('é um campo de senha e não grava a chave em nenhum armazenamento do navegador', async () => {
    const user = userEvent.setup()
    localStorage.clear()
    sessionStorage.clear()
    render(<Wrapper />)

    const campo = screen.getByLabelText(/chave da api/i)
    expect(campo).toHaveAttribute('type', 'password')
    expect(campo).toHaveAttribute('autocomplete', 'new-password')
    await user.type(campo, 'sk-ant-segredo')

    expect(campo).toHaveValue('sk-ant-segredo')
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
    expect(document.cookie).not.toContain('sk-ant')
  })
})
