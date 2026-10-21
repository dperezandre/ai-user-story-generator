import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useClient } from './useClient'

describe('useClient', () => {
  it('com chave usa a API e nem sonda a IA local', () => {
    const sondar = vi.fn().mockResolvedValue(true)
    const { result } = renderHook(() => useClient('sk-ant-x', sondar))
    expect(result.current.modo).toBe('chave')
    expect(result.current.demo).toBe(false)
    expect(sondar).not.toHaveBeenCalled()
  })

  it('sem chave e com IA local disponível usa a IA local', async () => {
    const { result } = renderHook(() => useClient('', vi.fn().mockResolvedValue(true)))
    await waitFor(() => expect(result.current.modo).toBe('local'))
    expect(result.current.demo).toBe(false)
  })

  it('sem chave e sem IA local cai no modo demo', async () => {
    const sondar = vi.fn().mockResolvedValue(false)
    const { result } = renderHook(() => useClient('', sondar))
    await waitFor(() => expect(sondar).toHaveBeenCalled())
    expect(result.current.modo).toBe('demo')
    expect(result.current.demo).toBe(true)
  })
})
