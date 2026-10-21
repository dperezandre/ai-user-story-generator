import type { z } from 'zod'
import { AppError, err, ok, type Result } from './errors'
import { extractJson } from './json'
import type { LlmClient, LlmRequest } from '../llm/client'

async function tentar<T>(client: LlmClient, req: LlmRequest, schema: z.ZodType<T>): Promise<Result<T> | { retry: string; raw: string }> {
  let texto: string
  try {
    texto = await client.complete(req)
  } catch (e) {
    if (e instanceof AppError) return { ok: false, error: e }
    return { ok: false, error: new AppError('rede', 'Falha inesperada ao falar com a IA. Tente novamente.') }
  }
  try {
    const parsed = schema.safeParse(extractJson(texto))
    if (parsed.success) return ok(parsed.data)
    return { retry: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '), raw: texto }
  } catch (e) {
    if (e instanceof AppError) return { retry: e.message, raw: texto }
    throw e
  }
}

export async function completeValidated<T>(client: LlmClient, req: LlmRequest, schema: z.ZodType<T>): Promise<Result<T>> {
  const primeira = await tentar(client, req, schema)
  if (!('retry' in primeira)) return primeira

  const segunda = await tentar(
    client,
    { ...req, user: `${req.user}\n\nSua resposta anterior era inválida (${primeira.retry}). Responda de novo somente com o JSON no formato pedido.` },
    schema,
  )
  if (!('retry' in segunda)) return segunda
  return err('formato', 'A IA não devolveu uma resposta no formato esperado. Tente novamente.', segunda.raw)
}
