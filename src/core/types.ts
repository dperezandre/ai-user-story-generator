import { z } from 'zod'

export const GherkinSchema = z.object({ dado: z.string(), quando: z.string(), entao: z.string() })
export const InvestItemSchema = z.object({ ok: z.boolean(), comentario: z.string() })

export const StorySchema = z.object({
  id: z.string(),
  titulo: z.string(),
  persona: z.string(),
  quero: z.string(),
  para: z.string(),
  dependeDe: z.array(z.string()),
  origem: z.string(),
  criteriosAceite: z.array(GherkinSchema).min(1),
  invest: z.object({
    independente: InvestItemSchema,
    negociavel: InvestItemSchema,
    valiosa: InvestItemSchema,
    estimavel: InvestItemSchema,
    pequena: InvestItemSchema,
    testavel: InvestItemSchema,
  }),
  perguntasRefinamento: z.array(z.string()),
  sugestaoQuebra: z.array(z.string()).nullable(),
})

export const LacunaSchema = z.object({ trecho: z.string(), problema: z.string(), pergunta: z.string() })

export const AnaliseSchema = z.object({
  titulo: z.string(),
  objetivo: z.string(),
  justificativa: z.string(),
  areasImpactadas: z.array(z.string()),
  historias: z.array(
    z.object({
      id: z.string(),
      titulo: z.string(),
      resumo: z.string(),
      origem: z.string(),
      dependeDe: z.array(z.string()),
    }),
  ),
  lacunas: z.array(LacunaSchema),
  ordemSugerida: z.array(z.string()),
})

export const EpicSchema = z.object({
  titulo: z.string(),
  objetivo: z.string(),
  justificativa: z.string(),
  areasImpactadas: z.array(z.string()),
  stories: z.array(StorySchema),
  lacunas: z.array(LacunaSchema),
  ordemSugerida: z.array(z.string()),
})

export type Gherkin = z.infer<typeof GherkinSchema>
export type Story = z.infer<typeof StorySchema>
export type Lacuna = z.infer<typeof LacunaSchema>
export type Analise = z.infer<typeof AnaliseSchema>
export type Epic = z.infer<typeof EpicSchema>
