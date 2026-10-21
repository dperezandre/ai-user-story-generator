import { describe, it, expect } from 'vitest'
import { StorySchema } from './types'
import { historiaValida } from './fixtures'

describe('StorySchema', () => {
  it('aceita uma história completa e válida', () => {
    expect(StorySchema.safeParse(historiaValida).success).toBe(true)
  })

  it('rejeita critérios de aceite vazios', () => {
    expect(StorySchema.safeParse({ ...historiaValida, criteriosAceite: [] }).success).toBe(false)
  })

  it('rejeita INVEST sem o critério "pequena"', () => {
    const invest: Record<string, unknown> = { ...historiaValida.invest }
    delete invest.pequena
    expect(StorySchema.safeParse({ ...historiaValida, invest }).success).toBe(false)
  })
})
