import { AppError } from '../core/errors'

const FORMATO_NAO_SUPORTADO = 'Formato não suportado: use .pdf, .docx, .md ou .txt'
const DOC_ANTIGO = 'Arquivos .doc antigos não são suportados: abra no Word e salve como .docx.'

async function lerPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default

  const documento = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const paginas: string[] = []
  for (let n = 1; n <= documento.numPages; n++) {
    const conteudo = await (await documento.getPage(n)).getTextContent()
    paginas.push(
      conteudo.items
        .map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : '') : ''))
        .join('')
        .trim(),
    )
  }
  return paginas.filter(Boolean).join('\n\n')
}

async function lerTexto(file: File, extensao: string): Promise<string> {
  if (extensao === 'pdf') return lerPdf(file)
  if (extensao === 'docx') {
    const { default: mammoth } = await import('mammoth')
    const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return value
  }
  return file.text()
}

export async function extractText(file: File): Promise<string> {
  const extensao = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (extensao === 'doc') throw new AppError('entrada', DOC_ANTIGO)
  if (!['pdf', 'docx', 'md', 'txt'].includes(extensao)) {
    throw new AppError('entrada', FORMATO_NAO_SUPORTADO)
  }
  let texto: string
  try {
    texto = await lerTexto(file, extensao)
  } catch (e) {
    if (e instanceof AppError) throw e
    throw new AppError('entrada', 'Não foi possível ler o arquivo. Confira se ele não está corrompido ou protegido por senha.')
  }
  if (!texto.trim()) {
    const dica = extensao === 'pdf' ? ' PDFs escaneados (imagem) não têm texto selecionável: use um PDF gerado pelo editor ou cole o texto.' : ''
    throw new AppError('entrada', `O arquivo não tem texto para analisar.${dica}`)
  }
  return texto
}
