export type ErrorKind = 'chave-invalida' | 'limite' | 'rede' | 'formato' | 'entrada' | 'documento-grande'

export class AppError extends Error {
  constructor(
    readonly kind: ErrorKind,
    message: string,
    readonly raw?: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError }

export const ok = <T>(value: T): Result<T> => ({ ok: true, value })
export const err = <T = never>(kind: ErrorKind, message: string, raw?: string): Result<T> => ({
  ok: false,
  error: new AppError(kind, message, raw),
})
