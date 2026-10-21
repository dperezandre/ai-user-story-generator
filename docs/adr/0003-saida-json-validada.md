# ADR 0003 — Saída da IA em JSON validada por schema

**Status:** aceita

## Contexto

A interface precisa de campos estruturados (história, cenários, INVEST, lacunas). Texto livre da IA obrigaria a interpretar formatos variáveis e quebraria a exportação e a edição.

## Decisão

Os prompts exigem resposta exclusivamente em JSON. O `core` extrai o JSON de forma tolerante (cercas de código, texto ao redor) e valida com Zod. Se a validação falhar, faz **uma** nova tentativa informando o erro à IA; se falhar de novo, devolve um erro tipado `formato`, com a resposta bruta disponível para inspeção.

Para documentos longos o processamento é feito em duas etapas: análise (épico, lista de histórias, lacunas, ordem) e detalhamento de cada história. Ids duplicados são rejeitados; ids inexistentes em dependências e ordem são descartados.

## Consequências

- Os tipos de `core/types.ts` são a fonte única da verdade para UI, exportação e testes.
- Falhas viram erros tipados com mensagens claras, sem resultado parcial enganoso.
- Duas etapas custam mais chamadas, mas mantêm a qualidade e respeitam o limite de contexto.
