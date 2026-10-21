# Gerador de Histórias de Usuário com IA — Design

Data: 2026-10-21 · Autor: André Perez · Status: v2 aguardando revisão (escopo ampliado após exemplo de documento de requisitos real)

## 1. Objetivo e público

Projeto de portfólio no GitHub que demonstra a um recrutador, em cerca de 1 minuto, que o autor é um **Product Owner que usa IA no dia a dia**, com visão de arquitetura e de projetos.

- **Público:** recrutadores e gestores que contratam Product Owners.
- **Sucesso:** o visitante abre o link, entende o problema, vê o resultado funcionando (sem precisar de chave de API) e percebe domínio de produto (INVEST, DoR, Gherkin), arquitetura limpa e engenharia de prompt tratada como produto.
- **Idioma:** português do Brasil (interface, prompts, documentação).
- **Dados:** somente fictícios. Nenhuma informação de empregadores (atuais ou anteriores) ou de pacientes.

Este é o primeiro de quatro projetos (depois: Product Playbook, case study de saúde, calculadora de priorização). Cada um tem repositório, spec e plano próprios.

## 2. Escopo

### Dentro

**Dois modos de entrada**
- **Necessidade curta:** uma ou duas frases geram **uma** história completa.
- **Documento de requisitos (principal):** texto longo e estruturado da área de negócio (objetivo, justificativa, telas, campos, validações, regras). Pode ser colado ou importado de `.docx`/`.md`/`.txt` (leitura no navegador, nada é enviado a servidor).

**Saída do modo documento (quebra de histórias)**
1. **Épico** com objetivo, justificativa e sistemas/áreas impactadas.
2. **Lista de histórias** ordenadas, cada uma com: história (Como… quero… para…), critérios de aceite em Gherkin, avaliação INVEST, dependências entre histórias e rastreabilidade ao trecho do documento de origem.
3. **Lacunas e ambiguidades detectadas** no documento (regras faltando, valores repetidos ou contraditórios, termos sem definição, blocos duplicados), cada uma com pergunta pronta para levar à área de negócio.
4. **Sugestão de fatiamento** quando uma história for grande (por exemplo, separar chave de ativação, cadastro, validações e auditoria).
5. **Sugestão de ordem de entrega** (primeiras histórias que destravam as demais).

**Saída do modo curto:** história, Gherkin, INVEST, perguntas de refinamento e sugestão de quebra.

**Comuns aos dois modos**
- Tudo editável na tela.
- Exportação: Markdown e formato pronto para Azure DevOps/Jira (texto/HTML simples), por história e do épico inteiro.
- **Modo demo** com exemplos pré-gerados (um curto e um documento completo), usado sem chave de API.
- **Modo real** com a API Claude, com a chave do próprio usuário.
- Avaliador de prompts (eval) com casos curtos e documentos de exemplo.
- Documentação: README de vitrine, ADRs, diagrama C4 simples.

### Fora (YAGNI)
Login, banco de dados, importação de PDF, histórico salvo, backend próprio, integração direta com Jira/Azure DevOps, multiusuário.

## 3. Arquitetura

Aplicação **estática** (SPA) em **React + TypeScript + Vite**, publicada no **GitHub Pages**. Sem servidor.

```
src/
  prompts/   Prompts versionados (arquivos .md) com as regras de PO
  core/      Lógica independente de UI: montagem do prompt, schema, validação, erros
  llm/       Interface LlmClient + ClaudeClient + DemoClient
  ui/        Componentes React (entrada, resultado editável, exportação, configuração da chave)
  export/    Formatadores (Markdown, Azure DevOps/Jira)
evals/       Casos de exemplo e script de avaliação de prompts
docs/        ADRs, diagrama C4, spec e plano
```

### Unidades e interfaces

| Unidade | Responsabilidade | Interface | Depende de |
|---|---|---|---|
| `prompts/` | Conhecimento de PO: INVEST, DoR, Gherkin, tom, formato de saída | Arquivos lidos em build | nada |
| `core/` | Monta a requisição a partir do prompt e da necessidade; valida a resposta com schema (Zod); classifica erros | `generateStory(need, client) → Result<Story, AppError>` | `llm` (apenas a interface) |
| `llm/` | Fala com a IA | `interface LlmClient { complete(req): Promise<string> }` | rede (Claude) ou dados locais (demo) |
| `export/` | Converte `Story` em texto | funções puras `toMarkdown`, `toAzureDevOps` | tipos de `core` |
| `ui/` | Telas e estado | componentes React | `core`, `export` |

`ClaudeClient` e `DemoClient` são intercambiáveis. Trocar um pelo outro não altera `core` nem `ui`.

### Modelo de dados (`Story`)

```
Epic { titulo, objetivo, justificativa, areasImpactadas[],
       stories: Story[], lacunas: [{ trecho, problema, pergunta }],
       ordemSugerida: string[] }   // ids das histórias

Story {
  id, titulo, persona, quero, para,
  dependeDe: string[], origem: string,   // ids e trecho do documento
  criteriosAceite: [{ dado, quando, entao }],
  criteriosAceite: [{ dado, quando, entao }],
  invest: { independente, negociavel, valiosa, estimavel, pequena, testavel }
          cada um: { ok: boolean, comentario: string },
  perguntasRefinamento: string[],
  sugestaoQuebra: string[] | null
}
```

## 4. Fluxo de dados

1. Usuário digita a necessidade ou cola/importa o documento. Documentos longos são processados em **duas etapas** para ter qualidade e caber no contexto: (a) análise do documento (épico, lacunas, lista de histórias candidatas), (b) detalhamento de cada história (Gherkin, INVEST, perguntas).
2. `core` carrega o prompt de `prompts/`, monta a requisição e pede **saída em JSON** no formato de `Story`.
3. `llm` envia (Claude ou demo) e devolve o texto.
4. `core` faz o parse e valida com Zod.
   - Se inválido: **uma** nova tentativa automática com a mensagem de erro de validação anexada.
5. `ui` exibe o resultado, editável.
6. `export` gera o texto para copiar.

Sem chave de API informada, a aplicação usa o `DemoClient` automaticamente e sinaliza "modo demo" na tela.

## 5. Segurança e privacidade

- A chave é digitada pelo usuário e mantida **somente em memória da aba**. Não é gravada em `localStorage`, cookie ou log, e não é enviada a nenhum servidor do autor.
- A chamada vai direto do navegador à API da Anthropic (cabeçalho de acesso direto pelo navegador exigido pela API).
- Aviso fixo na tela: não colar dados sensíveis ou de pacientes.
- Sem analytics nem rastreadores.
- Dependências fixadas e atualização automática de segurança (Dependabot).

## 6. Tratamento de erros

| Situação | Comportamento |
|---|---|
| Chave inválida/ausente | Mensagem clara; oferece o modo demo |
| Limite de uso / 429 | Mensagem com orientação para tentar depois |
| Falha de rede | Mensagem e botão de tentar de novo |
| Resposta fora do formato | Uma nova tentativa automática; se falhar, mensagem e opção de ver a resposta bruta |
| Entrada vazia ou muito curta | Validação na tela antes de chamar a IA |

## 7. Testes e qualidade

- **Unitários (Vitest):** `core` (montagem, validação, retry) com `LlmClient` simulado; `export`.
- **Componentes (Testing Library):** fluxo principal em modo demo.
- **Avaliador de prompts (`evals/`):** 8 a 10 necessidades fictícias de saúde e outros setores; script que roda os casos e mede a conformidade com o schema e com os critérios INVEST/Gherkin. Serve para comparar versões do prompt. Execução manual (consome API), com os resultados de referência registrados no repositório.
- **CI (GitHub Actions):** lint, typecheck, testes e build a cada push.
- **Deploy:** GitHub Pages automático a partir da branch principal.

## 8. Documentação (parte do entregável)

- **README de vitrine:** problema, para quem é, demonstração (GIF), link para o app, como usar, decisões em destaque, link para ADRs.
- **ADRs:** (1) app estático sem backend, (2) chave em memória, (3) saída JSON validada por schema, (4) interface `LlmClient` com modo demo, (5) prompts versionados e avaliados.
- **Diagrama C4** (contexto e contêineres) em Mermaid.
- **Seção "O que um PO ganha com isso":** tempo de refinamento, padronização, qualidade dos critérios.

## 9. Critérios de aceite do projeto

1. Visitante abre o link do GitHub Pages e, sem chave, vê dois exemplos completos em modo demo: uma história curta e a quebra de um documento de requisitos em épico, histórias e lacunas.
2. Com chave válida, gera resultados reais a partir de texto curto novo e de um documento novo (colado ou `.docx`).
2a. A quebra de documento aponta as lacunas plantadas no documento de exemplo (valores repetidos, termos sem definição, blocos duplicados).
3. Resultado traz história, Gherkin, INVEST, perguntas e sugestão de quebra, tudo editável e exportável.
4. Chave nunca persiste fora da memória da aba.
5. CI verde; testes do `core` e de `export` passando.
6. README, ADRs e diagrama presentes e coerentes com o código.
7. Nenhum dado real de empregador ou paciente no repositório. O documento de exemplo é **fictício**, inspirado na estrutura de uma especificação real (rede hospitalar fictícia, mapeamento de códigos entre tabelas de convênios), sem nomes de pessoas, sistemas ou números de demanda reais.

## 10. Riscos e decisões em aberto

- **Chamada direta do navegador à API** expõe a chave ao próprio usuário (aceitável, pois é a chave dele). Mitigação: aviso e modo demo para quem não quiser informar chave.
- **Documento real de empregador:** o exemplo que o autor forneceu serviu só de referência de estrutura e não entra no repositório. O exemplo público é recriado do zero, com dados fictícios.
- **Documentos longos:** risco de estourar contexto ou perder qualidade; mitigado pelo processamento em duas etapas e por limite de tamanho com aviso.
- **Qualidade do demo:** os exemplos pré-gerados devem ser reais (gerados e revisados pelo autor), não inventados à mão.
- **Modelo de IA:** definido por constante configurável, com padrão no modelo mais recente adequado a custo e velocidade.
