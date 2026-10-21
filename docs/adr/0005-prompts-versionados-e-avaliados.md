# ADR 0005 — Prompts versionados e avaliados

**Status:** aceita

## Contexto

O conhecimento de Product Owner do projeto (INVEST, Gherkin, DoR, o que é uma boa lacuna) vive nos prompts. Mudar um prompt sem medir pode piorar o resultado sem ninguém perceber.

## Decisão

Os prompts ficam em arquivos Markdown em `src/prompts/`, cada um com uma linha `versao: <n>`, e são carregados em build. Um avaliador (`npm run eval`) roda casos fictícios com a API real e mede conformidade com o schema, cenários Gherkin, cenário de erro, lacunas detectadas e consistência de ids. Os resultados são gravados em `evals/results/` com a versão dos prompts no nome.

## Consequências

- Mudanças de prompt viram diffs revisáveis e comparáveis entre versões.
- A avaliação é manual porque consome a API; os resultados de referência ficam no repositório.
- As métricas são heurísticas (por exemplo, detecção de cenário de erro por palavras-chave) e não substituem a revisão humana do conteúdo.
