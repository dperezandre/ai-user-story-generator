export type LlmKind = 'curto' | 'analise' | 'detalhe'

export interface LlmRequest {
  kind: LlmKind
  system: string
  user: string
  maxTokens?: number
}

export interface LlmClient {
  complete(req: LlmRequest): Promise<string>
}
