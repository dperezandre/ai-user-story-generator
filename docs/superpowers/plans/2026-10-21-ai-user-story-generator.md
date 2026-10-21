# Gerador de Histórias de Usuário com IA — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar uma SPA estática (GitHub Pages) que transforma uma necessidade curta em uma história de usuário e um documento de requisitos em épico, histórias, lacunas e ordem de entrega, com modo demo sem chave e modo real com API Claude.

**Architecture:** React + TypeScript + Vite, sem backend. `core/` (lógica pura, validação Zod, retry) depende só da interface `LlmClient`; `llm/` tem `ClaudeClient` (fetch direto do navegador) e `DemoClient` (fixtures pré-geradas); `prompts/` guarda o conhecimento de PO em arquivos versionados; `export/` e `ui/` consomem os tipos de `core/`.

**Tech Stack:** Node 20, Vite, React 18, TypeScript (strict), Zod, Vitest + Testing Library + jsdom, mammoth (importar .docx), tsx (scripts), ESLint, GitHub Actions + Pages.

**Spec:** `docs/superpowers/specs/2026-10-21-ai-user-story-generator-design.md` (v2)

## Global Constraints

- Idioma de interface, prompts e documentação: **português do Brasil**.
- **Sem backend.** A chave de API fica **somente em memória da aba** (estado React): nunca em `localStorage`, `sessionStorage`, cookie, URL ou log.
- Chamada direta do navegador: `POST https://api.anthropic.com/v1/messages` com os cabeçalhos `x-api-key`, `anthropic-version: 2023-06-01`, `anthropic-dangerous-direct-browser-access: true`, `content-type: application/json`. Sem SDK.
- Modelo em constante única `DEFAULT_MODEL = 'claude-sonnet-5-5'` em `src/llm/claudeClient.ts`.
- **Uma** nova tentativa automática quando a resposta não passa na validação; depois disso, erro `formato`.
- `MAX_DOC_CHARS = 30000` para documentos; acima disso, erro `documento-grande`, sem chamar a API.
- Entrada de necessidade curta com menos de 15 caracteres (após `trim`) → erro `entrada`, sem chamar a API.
- **Nenhum dado real** de empregador, pessoas ou pacientes no repositório. O documento de exemplo é fictício (rede hospitalar fictícia "Rede Vita Saúde").
- Aviso fixo na UI: não colar dados sensíveis ou de pacientes.
- Sem analytics, sem rastreadores. Dependências com versão fixada; Dependabot ativo.
- Cada tarefa termina com `npm run lint`, `npm run typecheck` e `npm test` verdes.

## Review Focus

1. Resposta do modelo vem cercada por ```` ```json ```` ou com texto antes/depois do JSON → o parse deve tolerar (Task 2).
2. Entrada vazia, só espaços ou muito curta; documento acima de `MAX_DOC_CHARS` → erro claro e **nenhuma** chamada à API (Tasks 5 e 6).
3. Análise referencia IDs inexistentes em `dependeDe`/`ordemSugerida`, ou repete IDs → IDs inválidos são descartados e IDs duplicados rejeitados (Task 6).
4. Texto com `<`, `>`, `&` e aspas nos campos → exportação para Azure DevOps (HTML) escapa tudo (Task 8).
5. Falha de rede ou 429 no meio da etapa de detalhamento (história 3 de 6) → erro tipado, sem resultado parcial enganoso, botão de tentar de novo (Tasks 6 e 11).

---

## Mapa de arquivos

```
src/core/types.ts          schemas Zod + tipos (Story, Epic, Analise, Lacuna, Gherkin)
src/core/errors.ts         AppError, Result
src/core/json.ts           extractJson(text): unknown
src/core/validated.ts      completeValidated com 1 retry
src/core/generateStory.ts  modo curto
src/core/generateEpic.ts   modo documento (2 etapas)
src/llm/client.ts          interface LlmClient, LlmRequest
src/llm/claudeClient.ts    ClaudeClient
src/llm/demoClient.ts      DemoClient + fixtures em src/llm/demo-data/
src/prompts/*.md           prompts versionados
src/prompts/index.ts       carrega os .md (?raw) e expõe PROMPTS
src/export/markdown.ts     storyToMarkdown, epicToMarkdown
src/export/azure.ts        storyToAzureDevOps
src/import/readFile.ts     extractText(file)
src/ui/*                   componentes
examples/documento-rede-vita.md   documento fictício com lacunas plantadas
scripts/gerar-demo.ts      gera as fixtures do demo com a chave do autor
evals/                     casos, runner, scoring
docs/                      adr/, c4.md
```

---

### Task 1: Scaffold do projeto

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/test-setup.ts`, `.gitignore`, `LICENSE` (MIT), `src/App.test.tsx`

**Interfaces:**
- Produces: scripts npm `dev`, `build`, `lint`, `typecheck`, `test`; `vite.config.ts` com `base: './'` e `test.environment: 'jsdom'`; import de `*.md?raw` tipado (`src/vite-env.d.ts` com `/// <reference types="vite/client" />`).

- [ ] **Step 1: Write the failing test** em `src/App.test.tsx`: renderiza `<App />` e espera `screen.getByRole('heading', { name: /gerador de histórias/i })`.
- [ ] **Step 2: Run** `npx vitest run` → FAIL (sem projeto/App).
- [ ] **Step 3: Scaffold** com o template Vite `react-ts` na raiz (preservando `docs/` e `.git`), adicionar dependências (`zod`, `mammoth`; dev: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `tsx`, `eslint` + plugins React/TS), `typecheck` = `tsc --noEmit`, TypeScript `strict: true`. `App` renderiza apenas o `<h1>Gerador de Histórias de Usuário com IA</h1>`.
- [ ] **Step 4: Run** `npm run lint && npm run typecheck && npm test && npm run build` → todos passam.
- [ ] **Step 5: Commit** `chore: scaffold vite react ts com vitest e eslint`.

---

### Task 2: Tipos, schemas e parse tolerante de JSON

**Files:**
- Create: `src/core/types.ts`, `src/core/errors.ts`, `src/core/json.ts`
- Test: `src/core/types.test.ts`, `src/core/json.test.ts`

**Interfaces:**
- Produces (`types.ts`, todos com Zod e `z.infer`):
  - `GherkinSchema {dado, quando, entao: string}`
  - `InvestItemSchema {ok: boolean, comentario: string}`
  - `StorySchema {id, titulo, persona, quero, para: string; dependeDe: string[]; origem: string; criteriosAceite: Gherkin[] (min 1); invest: {independente, negociavel, valiosa, estimavel, pequena, testavel: InvestItem}; perguntasRefinamento: string[]; sugestaoQuebra: string[] | null}`
  - `LacunaSchema {trecho, problema, pergunta: string}`
  - `AnaliseSchema {titulo, objetivo, justificativa: string; areasImpactadas: string[]; historias: {id, titulo, resumo, origem: string; dependeDe: string[]}[]; lacunas: Lacuna[]; ordemSugerida: string[]}`
  - `EpicSchema {titulo, objetivo, justificativa; areasImpactadas; stories: Story[]; lacunas: Lacuna[]; ordemSugerida: string[]}`
- Produces (`errors.ts`): `type ErrorKind = 'chave-invalida'|'limite'|'rede'|'formato'|'entrada'|'documento-grande'`; `class AppError extends Error { constructor(readonly kind: ErrorKind, message: string, readonly raw?: string) }`; `type Result<T> = {ok: true; value: T} | {ok: false; error: AppError}`; helpers `ok(v)`, `err(kind, message, raw?)`.
- Produces (`json.ts`): `extractJson(text: string): unknown` — lança `AppError('formato', …, text)` se não achar JSON.

- [ ] **Step 1: Write failing tests**
  - `types.test.ts`: `StorySchema.safeParse` aceita história completa válida; rejeita `criteriosAceite: []`; rejeita INVEST sem `pequena`.
  - `json.test.ts`: `extractJson('```json\n{"a":1}\n```')` → `{a:1}`; `extractJson('Aqui está:\n{"a":1}\nFim')` → `{a:1}`; `extractJson('sem json')` lança `AppError` com `kind === 'formato'` e `raw === 'sem json'`.
- [ ] **Step 2: Run** `npx vitest run src/core` → FAIL.
- [ ] **Step 3: Implement** os três arquivos. `extractJson`: remove cercas, tenta `JSON.parse`; senão extrai do primeiro `{` ao último `}` balanceado.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(core): schemas zod, erros tipados e parse tolerante de json`.

---

### Task 3: Interface LlmClient e ClaudeClient

**Files:**
- Create: `src/llm/client.ts`, `src/llm/claudeClient.ts`
- Test: `src/llm/claudeClient.test.ts`

**Interfaces:**
- Consumes: `AppError` (Task 2).
- Produces: `type LlmKind = 'curto'|'analise'|'detalhe'`; `interface LlmRequest {kind: LlmKind; system: string; user: string; maxTokens?: number}`; `interface LlmClient {complete(req: LlmRequest): Promise<string>}`; `class ClaudeClient implements LlmClient { constructor(apiKey: string, fetchImpl?: typeof fetch) }`; `export const DEFAULT_MODEL`. `complete` devolve o texto do primeiro bloco `text` e **lança** `AppError` (o `Result` é montado no core).

- [ ] **Step 1: Write failing tests** (com `fetchImpl` simulado):
  - envia `POST` a `https://api.anthropic.com/v1/messages` com os 4 cabeçalhos da seção Global Constraints e corpo contendo `model: DEFAULT_MODEL`, `system`, `messages: [{role:'user', content: user}]`, `max_tokens` (padrão 4096);
  - resposta 200 `{content:[{type:'text', text:'olá'}]}` → `'olá'`;
  - 401 → `AppError.kind === 'chave-invalida'`; 429 → `'limite'`; `fetch` rejeita → `'rede'`; 500 → `'rede'`;
  - a chave **não** aparece em nenhuma mensagem de erro.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** conforme as interfaces.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(llm): interface LlmClient e ClaudeClient`.

---

### Task 4: Prompts versionados

**Files:**
- Create: `src/prompts/curto.md`, `src/prompts/analise.md`, `src/prompts/detalhe.md`, `src/prompts/index.ts`, `src/prompts/prompts.test.ts`

**Interfaces:**
- Produces: `PROMPTS: Record<LlmKind, {versao: string; system: string}>`, lidos via `import x from './curto.md?raw'`. A `versao` vem da primeira linha `versao: <n>` de cada arquivo (removida do `system`).

Conteúdo obrigatório de cada prompt (o implementador redige em português):
- `curto.md`: papel de PO sênior; formato "Como [persona], quero [ação], para [benefício]"; critérios em Gherkin (Dado/Quando/Então, mínimo 2, incluindo um cenário de erro); avaliação INVEST com `ok` e `comentario` por critério; perguntas de refinamento; `sugestaoQuebra` quando a história não for "pequena"; **saída exclusivamente JSON** no formato de `StorySchema`; não inventar regras de negócio ausentes (registrar como pergunta).
- `analise.md`: recebe o documento; devolve **somente JSON** no formato de `AnaliseSchema`; IDs `H1`, `H2`…; fatiar em histórias pequenas (ex.: chave de ativação, cadastro, validações, auditoria); `origem` cita o trecho de origem; detectar lacunas (valores repetidos/contraditórios, termos sem definição, blocos duplicados, regras faltando) com pergunta pronta; `ordemSugerida` coloca primeiro o que destrava as demais.
- `detalhe.md`: recebe o épico resumido, a história candidata (`ID: <id>`) e o trecho de origem; devolve **somente JSON** no formato de `StorySchema` com o mesmo `id`.

- [ ] **Step 1: Write failing test** (`prompts.test.ts`): para cada kind, `PROMPTS[kind].versao` casa `/^\d+$/`; `system` contém `INVEST` (curto e detalhe), `Gherkin` (curto e detalhe), `JSON` (os três), `lacunas` (analise); nenhum `system` contém a linha `versao:`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Write** os três `.md` e `index.ts`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(prompts): prompts de PO versionados`.

---

### Task 5: Modo curto — `generateStory`

**Files:**
- Create: `src/core/validated.ts`, `src/core/generateStory.ts`
- Test: `src/core/validated.test.ts`, `src/core/generateStory.test.ts`

**Interfaces:**
- Consumes: `LlmClient`, `LlmRequest` (Task 3); `extractJson`, schemas, `Result`/`err`/`ok` (Task 2); `PROMPTS` (Task 4).
- Produces:
  - `completeValidated<T>(client: LlmClient, req: LlmRequest, schema: z.ZodType<T>): Promise<Result<T>>` — chama `client.complete`, `extractJson`, `schema.safeParse`; em falha de parse/validação, **uma** nova chamada com o erro anexado ao `user`; segunda falha → `err('formato', …, raw)`; erros de `AppError` lançados pelo cliente viram `{ok:false}` sem retry (exceto nenhum).
  - `MIN_NEED_CHARS = 15`; `generateStory(need: string, client: LlmClient): Promise<Result<Story>>`.

- [ ] **Step 1: Write failing tests** (cliente falso):
  - `completeValidated`: resposta válida de primeira → 1 chamada; inválida e depois válida → 2 chamadas, `ok`; inválida duas vezes → `error.kind === 'formato'` e 2 chamadas; `AppError('limite')` do cliente → `{ok:false}` com 1 chamada.
  - `generateStory`: entrada `''`, `'   '` e `'curta'` → `kind 'entrada'` e **0** chamadas; entrada válida usa `kind: 'curto'` e `system === PROMPTS.curto.system`; resposta em cerca ```` ```json ```` → `ok`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(core): modo curto com validação e retry`.

---

### Task 6: Modo documento — `generateEpic`

**Files:**
- Create: `src/core/generateEpic.ts`
- Test: `src/core/generateEpic.test.ts`

**Interfaces:**
- Consumes: `completeValidated` (Task 5), `AnaliseSchema`, `StorySchema`, `PROMPTS`.
- Produces: `MAX_DOC_CHARS = 30000`; `generateEpic(doc: string, client: LlmClient, onProgress?: (feitas: number, total: number) => void): Promise<Result<Epic>>`.

Comportamento: (1) valida entrada (vazia/`< MIN_NEED_CHARS` → `entrada`; `> MAX_DOC_CHARS` → `documento-grande`; ambos sem chamar a API); (2) etapa A: `kind: 'analise'` → `Analise`; (3) saneia: IDs duplicados em `historias` → `err('formato')`; remove de `dependeDe` e `ordemSugerida` os IDs inexistentes; histórias ausentes de `ordemSugerida` são anexadas ao fim; (4) etapa B: para cada história candidata, em sequência, `kind: 'detalhe'` com `user` contendo `ID: <id>`, o resumo do épico e o `origem`; (5) `onProgress(i, total)` a cada história concluída; (6) qualquer falha na etapa B devolve o erro tipado, **sem** épico parcial; (7) monta `Epic` com `stories` na ordem de `ordemSugerida`.

- [ ] **Step 1: Write failing tests** (cliente falso que responde por `kind`):
  - fluxo feliz com 3 histórias → `ok`, `stories.length === 3`, ordem igual a `ordemSugerida`, `onProgress` chamado com `(1,3)`,`(2,3)`,`(3,3)`, 1 chamada `analise` + 3 `detalhe`;
  - `dependeDe: ['H9']` inexistente → removido do resultado;
  - IDs duplicados `H1`,`H1` → `kind 'formato'`;
  - `ordemSugerida` sem `H3` → `H3` aparece ao fim;
  - documento de 30001 caracteres → `documento-grande`, 0 chamadas;
  - 2ª chamada `detalhe` lança `AppError('rede')` → `{ok:false, error.kind:'rede'}`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(core): quebra de documento em épico, histórias e lacunas`.

---

### Task 7: Documento de exemplo, DemoClient e fixtures

**Files:**
- Create: `examples/documento-rede-vita.md`, `examples/necessidade-curta.md`, `src/llm/demoClient.ts`, `scripts/gerar-demo.ts`, `src/llm/demo-data/{curto.json,analise.json,detalhes.json}`
- Test: `src/llm/demoClient.test.ts`

**Interfaces:**
- Consumes: `LlmClient`, `LlmRequest`; schemas (para validar as fixtures).
- Produces: `class DemoClient implements LlmClient { constructor(fixtures?: DemoFixtures) }` (padrão = os JSON importados); `export const EXEMPLO_CURTO: string`, `export const EXEMPLO_DOCUMENTO: string` (conteúdo dos arquivos em `examples/`, via `?raw`). `complete`: `curto` → `curto.json` serializado; `analise` → `analise.json`; `detalhe` → procura `ID: <id>` no `user` e devolve `detalhes[id]`; id desconhecido → `AppError('formato')`.

O documento fictício `documento-rede-vita.md` (cerca de 1,5 a 2 páginas) segue a estrutura de uma especificação de requisitos: objetivo, justificativa, sistemas impactados, requisitos (chave liga/desliga por unidade; tela administrativa de mapeamento "código único ↔ tabelas por convênio" com duas abas; campos com validação contra uma tabela de cadastro; auditoria). **Lacunas plantadas obrigatórias:** (1) lista de classes com dois códigos distintos para o mesmo nome; (2) bloco descrito duas vezes de forma idêntica nas duas abas; (3) um termo ("código fictício") sem definição; (4) regra de validação citada sem a mensagem de erro; (5) "múltiplos exames por pacote" sem limite ou regra de duplicidade. Nenhum nome de pessoa, sistema ou número de demanda real.

- [ ] **Step 1: Write failing tests** (`demoClient.test.ts`): `curto` e `analise` retornam JSON que passa em `StorySchema`/`AnaliseSchema`; cada `historias[i].id` da análise tem entrada em `detalhes` e passa em `StorySchema`; `detalhe` com `ID: H1` devolve a história `H1`; id inexistente lança `AppError` `formato`; `analise.lacunas.length >= 5`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `DemoClient` e `scripts/gerar-demo.ts` (lê `ANTHROPIC_API_KEY`, roda `generateEpic` e `generateStory` com `ClaudeClient` sobre os exemplos, grava os três JSON; script `npm run gerar-demo`). Escrever os exemplos em `examples/`.
- [ ] **Step 4: Gerar as fixtures reais** — **passo manual do autor**: `ANTHROPIC_API_KEY=... npm run gerar-demo`, **revisar e ajustar** os JSON (conferir que as 5 lacunas foram detectadas; corrigir erros de português ou de produto). Fixtures escritas à mão sem geração real não são aceitas (spec, seção 10).
- [ ] **Step 5: Run** testes → PASS. **Commit** `feat(llm): DemoClient, exemplo fictício e fixtures reais`.

---

### Task 8: Exportação

**Files:**
- Create: `src/export/markdown.ts`, `src/export/azure.ts`
- Test: `src/export/markdown.test.ts`, `src/export/azure.test.ts`

**Interfaces:**
- Consumes: `Story`, `Epic`.
- Produces: `storyToMarkdown(s: Story): string`; `epicToMarkdown(e: Epic): string`; `storyToAzureDevOps(s: Story): {title: string; descriptionHtml: string; acceptanceCriteriaHtml: string}`.

- [ ] **Step 1: Write failing tests**:
  - `storyToMarkdown` contém `## <titulo>`, a linha `Como <persona>, quero <quero>, para <para>.`, e cada critério como `**Dado** … **Quando** … **Então** …`;
  - `epicToMarkdown` lista as histórias na ordem de `ordemSugerida` e uma seção `Lacunas` com `trecho`, `problema` e `pergunta`;
  - `storyToAzureDevOps`: `title === s.titulo`; `acceptanceCriteriaHtml` tem um `<li>` por critério;
  - **escape:** uma história com `quero: '<script>alert("x")</script> & "aspas"'` produz HTML sem `<script>` literal (`&lt;script&gt;`, `&amp;`, `&quot;`).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(export): markdown e azure devops com escape de html`.

---

### Task 9: Importação de arquivos

**Files:**
- Create: `src/import/readFile.ts`
- Test: `src/import/readFile.test.ts`

**Interfaces:**
- Consumes: `AppError`.
- Produces: `extractText(file: File): Promise<string>` — `.md`/`.txt` via `file.text()`; `.docx` via `mammoth.extractRawText({arrayBuffer})`; outras extensões → `AppError('entrada', 'Formato não suportado: use .docx, .md ou .txt')`; texto resultante vazio → `AppError('entrada')`.

- [ ] **Step 1: Write failing tests:** `.txt` e `.md` devolvem o conteúdo; `.pdf` lança `entrada`; arquivo `.txt` vazio lança `entrada`; `.docx` com `mammoth` simulado (`vi.mock('mammoth')`) devolve o texto simulado.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(import): leitura de docx, md e txt no navegador`.

---

### Task 10: UI — configuração, modo curto e edição

**Files:**
- Create: `src/ui/useClient.ts`, `src/ui/KeyField.tsx`, `src/ui/ErrorBanner.tsx`, `src/ui/ExportBar.tsx`, `src/ui/StoryCard.tsx`, `src/ui/ShortMode.tsx`; Modify: `src/App.tsx`
- Test: `src/ui/ShortMode.test.tsx`, `src/ui/KeyField.test.tsx`

**Interfaces:**
- Consumes: `generateStory`, `ClaudeClient`, `DemoClient`, `EXEMPLO_CURTO`, `storyToMarkdown`, `storyToAzureDevOps`, `AppError`.
- Produces: `useClient(apiKey: string): {client: LlmClient; demo: boolean}` (`demo === true` quando a chave está vazia); `<StoryCard story onChange />` com todos os campos editáveis (inputs/textarea); `<ExportBar onCopyMarkdown onCopyAzure />` (copia para a área de transferência e mostra "Copiado"); `<ErrorBanner error: AppError, onRetry? />` com mensagem em português por `kind`; `<KeyField value onChange />` (`type="password"`, estado só em memória). `App` mantém `apiKey` em `useState`, abas "História curta" e "Documento de requisitos" (esta última entra na Task 11), aviso fixo de dados sensíveis e selo "Modo demo" quando `demo`.

- [ ] **Step 1: Write failing tests:**
  - em modo demo, `ShortMode` mostra o `EXEMPLO_CURTO` pré-carregado e, ao clicar "Gerar", exibe o título da história da fixture;
  - editar o campo "Quero" altera o texto exibido e o Markdown copiado reflete a edição;
  - `KeyField`: após digitar uma chave, `localStorage.length === 0` e `sessionStorage.length === 0`, e o `input` é `type="password"`;
  - com erro `chave-invalida`, `ErrorBanner` oferece o modo demo ("Usar modo demo");
  - entrada curta demais mostra o erro `entrada` e não chama o cliente.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(ui): modo curto, chave em memória e exportação`.

---

### Task 11: UI — modo documento

**Files:**
- Create: `src/ui/DocumentMode.tsx`, `src/ui/EpicView.tsx`, `src/ui/LacunasPanel.tsx`; Modify: `src/App.tsx`
- Test: `src/ui/DocumentMode.test.tsx`

**Interfaces:**
- Consumes: `generateEpic`, `extractText`, `EXEMPLO_DOCUMENTO`, `epicToMarkdown`, `StoryCard`, `ErrorBanner`, `ExportBar`.
- Produces: `<DocumentMode client demo />` com área de texto, botão "Importar arquivo" (`.docx,.md,.txt`), indicador de progresso "Detalhando história i de N", `<EpicView epic onChange />` (cabeçalho do épico, ordem sugerida, lista de `StoryCard`, dependências visíveis), `<LacunasPanel lacunas />` (trecho, problema e pergunta com botão "Copiar perguntas"), exportação do épico inteiro em Markdown.

- [ ] **Step 1: Write failing tests:**
  - modo demo: documento de exemplo pré-carregado; "Gerar" mostra o título do épico, as histórias na ordem sugerida e o painel com ≥ 5 lacunas;
  - progresso: com cliente falso lento, aparece "Detalhando história 1 de 3";
  - falha de rede na 2ª história → `ErrorBanner` com botão "Tentar de novo" e **nenhum** `StoryCard` renderizado;
  - importar arquivo `.txt` preenche a área de texto; `.pdf` mostra erro `entrada`;
  - documento > `MAX_DOC_CHARS` mostra `documento-grande` e não chama o cliente.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(ui): quebra de documento com épico, histórias e lacunas`.

---

### Task 12: Avaliador de prompts

**Files:**
- Create: `evals/score.ts`, `evals/run.ts`, `evals/cases/*.json` (8 a 10 casos fictícios), `evals/README.md`
- Test: `evals/score.test.ts`

**Interfaces:**
- Consumes: `generateStory`, `generateEpic`, `ClaudeClient`, `PROMPTS`.
- Produces: `scoreStory(s: Story): {gherkinCount: number; temCenarioDeErro: boolean; investReprovados: string[]; perguntas: number}`; `scoreEpic(e: Epic, esperado: {lacunasMin: number}): {historias: number; lacunas: number; atendeLacunas: boolean; idsConsistentes: boolean}`. `npm run eval` roda os casos com `ANTHROPIC_API_KEY`, grava `evals/results/<AAAA-MM-DD>-v<versão dos prompts>.json` e imprime uma tabela. Cada caso: `{id, tipo: 'curto'|'documento', entrada, esperado}` — casos de saúde e de outros setores.

- [ ] **Step 1: Write failing tests** (`score.test.ts`): história com 3 critérios, um deles com `entao` citando erro/mensagem → `gherkinCount 3`, `temCenarioDeErro true`; INVEST com `pequena.ok=false` → `investReprovados === ['pequena']`; épico com 5 lacunas e `lacunasMin: 5` → `atendeLacunas true`; épico com `ordemSugerida` contendo id inexistente → `idsConsistentes false`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `score.ts`, `run.ts` e escrever os casos.
- [ ] **Step 4: Run** testes → PASS. **Passo manual do autor:** `npm run eval` com chave real e commitar o primeiro resultado como referência.
- [ ] **Step 5: Commit** `feat(evals): avaliador de prompts e resultado de referência`.

---

### Task 13: CI, deploy e segurança de dependências

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `.github/dependabot.yml`

**Interfaces:** nenhuma de código.

- [ ] **Step 1: ci.yml:** em `push` e `pull_request`: Node 20, `npm ci`, `lint`, `typecheck`, `test`, `build`.
- [ ] **Step 2: deploy.yml:** em `push` na branch principal: build e publicação em GitHub Pages (`actions/upload-pages-artifact` + `actions/deploy-pages`, permissões `pages: write`, `id-token: write`).
- [ ] **Step 3: dependabot.yml:** `npm` e `github-actions`, semanal.
- [ ] **Step 4: Verificar localmente** `npm ci && npm run lint && npm run typecheck && npm test && npm run build` → todos passam; confirmar que `dist/` não contém a string `sk-ant`.
- [ ] **Step 5: Commit** `ci: pipeline, deploy no pages e dependabot`. **Passo manual do autor:** criar o repositório no GitHub, habilitar Pages (fonte: GitHub Actions) e dar push.

---

### Task 14: Documentação de vitrine

**Files:**
- Create: `README.md`, `docs/adr/0001-app-estatico-sem-backend.md`, `0002-chave-em-memoria.md`, `0003-saida-json-validada.md`, `0004-interface-llmclient-e-modo-demo.md`, `0005-prompts-versionados-e-avaliados.md`, `docs/c4.md`, `docs/media/demo.gif`

**Interfaces:** nenhuma de código.

- [ ] **Step 1: README** (português), nesta ordem: título e uma frase de impacto; link do app; GIF; "O problema" (refinamento lento e inconsistente); "O que faz" (modo curto e quebra de documento, com lacunas); "Como usar" (demo sem chave; modo real com chave); "O que um PO ganha com isso" (tempo de refinamento, padronização, critérios melhores, perguntas prontas para o negócio); "Decisões de arquitetura" (links para as ADRs); "Privacidade" (chave só em memória, aviso de dados sensíveis); "Qualidade" (CI, testes, avaliador de prompts, resultados); "Rodar localmente"; autor e links.
- [ ] **Step 2: ADRs** no formato contexto/decisão/consequências, uma por decisão listada na spec (seção 8).
- [ ] **Step 3: `docs/c4.md`** com diagramas Mermaid de contexto e contêineres.
- [ ] **Step 4: Conferir** coerência: cada afirmação do README tem correspondência no código; nenhum dado real de empregador. buscar no repositório por nomes de empregadores, sistemas internos e pessoas reais (nenhum deve aparecer).
- [ ] **Step 5: Commit** `docs: readme de vitrine, adrs e diagrama c4`. **Passo manual do autor:** gravar o `demo.gif` do fluxo em modo demo.

---

## Auto-revisão

- **Cobertura da spec:** dois modos (Tasks 5, 6, 10, 11); saída completa do épico (Tasks 2, 6, 11); edição (Tasks 10, 11); exportação (Task 8); importação `.docx/.md/.txt` (Task 9); demo com dois exemplos (Task 7); modo real (Task 3); segurança da chave (Tasks 3, 10); erros (Tasks 3, 5, 6, 10, 11); eval (Task 12); CI/Pages/Dependabot (Task 13); README/ADR/C4 (Task 14); documento fictício com lacunas plantadas (Task 7).
- **Consistência de tipos:** `LlmClient.complete`, `LlmRequest`, `Result`, `Story`, `Epic`, `generateStory`, `generateEpic`, `DemoClient`, `EXEMPLO_*` usados com os mesmos nomes entre as tarefas.
- **Passos manuais do autor** (precisam de chave ou de conta GitHub): geração das fixtures (Task 7), execução do eval (Task 12), publicação no GitHub e GIF (Tasks 13 e 14).
