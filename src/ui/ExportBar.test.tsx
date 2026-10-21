import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExportBar } from './ExportBar'
import { storyToAzureDevOps } from '../export/azure'
import { historiaValida } from '../core/fixtures'

afterEach(() => vi.unstubAllGlobals())

describe('ExportBar', () => {
  it('copia o formato Azure DevOps como HTML rico quando o navegador suporta ClipboardItem', async () => {
    const itens: Record<string, Blob>[] = []
    vi.stubGlobal(
      'ClipboardItem',
      class {
        constructor(i: Record<string, Blob>) {
          itens.push(i)
        }
      },
    )
    const user = userEvent.setup()
    const write = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { write, writeText: vi.fn() }, configurable: true })
    render(<ExportBar markdown="# m" azure={storyToAzureDevOps(historiaValida)} />)

    await user.click(screen.getByRole('button', { name: /azure/i }))

    await waitFor(() => expect(write).toHaveBeenCalledOnce())
    expect(itens[0]['text/html'].type).toBe('text/html')
    expect(await itens[0]['text/html'].text()).toContain('<li>')
    expect(await itens[0]['text/plain'].text()).toContain(historiaValida.titulo)
  })

  it('sem ClipboardItem, copia o texto do item como texto puro', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<ExportBar markdown="# m" azure={storyToAzureDevOps(historiaValida)} />)

    await user.click(screen.getByRole('button', { name: /azure/i }))

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce())
    expect(writeText.mock.calls[0][0]).toContain(historiaValida.titulo)
  })
})
