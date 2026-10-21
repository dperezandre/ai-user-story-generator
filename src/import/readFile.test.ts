import { describe, it, expect, vi } from 'vitest'

const pdf = vi.hoisted(() => ({ paginas: [] as string[][] }))

vi.mock('mammoth', () => ({
  default: { extractRawText: vi.fn().mockResolvedValue({ value: 'texto vindo do docx' }) },
}))
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: () => ({
    promise: Promise.resolve({
      numPages: pdf.paginas.length,
      getPage: async (n: number) => ({
        getTextContent: async () => ({ items: pdf.paginas[n - 1].map((str) => ({ str, hasEOL: false })) }),
      }),
    }),
  }),
}))
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: 'worker-falso.js' }))

import { extractText } from './readFile'
import { AppError } from '../core/errors'

const arquivo = (conteudo: string, nome: string) => new File([conteudo], nome)

describe('extractText', () => {
  it('lê .txt e .md', async () => {
    expect(await extractText(arquivo('olá mundo', 'a.txt'))).toBe('olá mundo')
    expect(await extractText(arquivo('# título', 'a.md'))).toBe('# título')
  })

  it('lê .docx com mammoth', async () => {
    expect(await extractText(arquivo('binario', 'req.docx'))).toBe('texto vindo do docx')
  })

  it('lê .pdf juntando o texto de todas as páginas', async () => {
    pdf.paginas = [['Objetivo ', 'do documento'], ['Requisito ', 'dois']]
    const texto = await extractText(arquivo('binario', 'req.pdf'))
    expect(texto).toContain('Objetivo do documento')
    expect(texto).toContain('Requisito dois')
    expect(texto.indexOf('Objetivo')).toBeLessThan(texto.indexOf('Requisito'))
  })

  it('avisa quando o PDF não tem texto selecionável (escaneado)', async () => {
    pdf.paginas = [[], []]
    const e = await extractText(arquivo('binario', 'escaneado.pdf')).catch((x) => x)
    expect(e).toBeInstanceOf(AppError)
    expect(e.kind).toBe('entrada')
    expect(e.message).toMatch(/selecion|escane/i)
  })

  it('rejeita formato não suportado e cita os aceitos', async () => {
    const e = await extractText(arquivo('x', 'a.xlsx')).catch((x) => x)
    expect(e).toBeInstanceOf(AppError)
    expect(e.kind).toBe('entrada')
    expect(e.message).toContain('.pdf')
    expect(e.message).toContain('.docx')
  })

  it('sugere salvar como .docx quando recebe um .doc antigo', async () => {
    const e = await extractText(arquivo('x', 'antigo.doc')).catch((x) => x)
    expect(e.kind).toBe('entrada')
    expect(e.message).toMatch(/salve como \.docx/i)
  })

  it('rejeita arquivo sem texto', async () => {
    const e = await extractText(arquivo('   \n', 'vazio.txt')).catch((x) => x)
    expect(e).toBeInstanceOf(AppError)
    expect(e.kind).toBe('entrada')
  })

  it('reconhece a extensão sem diferenciar maiúsculas', async () => {
    expect(await extractText(arquivo('ok', 'A.TXT'))).toBe('ok')
  })
})
