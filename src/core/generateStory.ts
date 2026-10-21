import { err, type Result } from './errors'
import { StorySchema, type Story } from './types'
import { completeValidated } from './validated'
import { PROMPTS } from '../prompts'
import type { LlmClient } from '../llm/client'

export const MIN_NEED_CHARS = 15

export async function generateStory(need: string, client: LlmClient): Promise<Result<Story>> {
  const texto = need.trim()
  if (texto.length < MIN_NEED_CHARS) {
    return err('entrada', `Descreva a necessidade com pelo menos ${MIN_NEED_CHARS} caracteres.`)
  }
  return completeValidated(client, { kind: 'curto', system: PROMPTS.curto.system, user: texto }, StorySchema)
}
