import { describe, it, expect } from 'vitest'
import { extractJson } from './json'
import { AppError } from './errors'

describe('extractJson', () => {
  it('lê JSON cercado por ```json', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })

  it('lê JSON com texto antes e depois', () => {
    expect(extractJson('Aqui está:\n{"a":1}\nFim')).toEqual({ a: 1 })
  })

  it('lança AppError formato com o texto bruto quando não há JSON', () => {
    try {
      extractJson('sem json')
      expect.unreachable()
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      expect((e as AppError).kind).toBe('formato')
      expect((e as AppError).raw).toBe('sem json')
    }
  })
})
