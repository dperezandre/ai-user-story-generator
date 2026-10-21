# ADR 0004 — Interface `LlmClient` e modo demo

**Status:** aceita

## Contexto

O recrutador deve ver o app funcionando sem chave de API, e os testes não devem depender de rede ou de custo.

## Decisão

O `core` depende apenas da interface `LlmClient { complete(req): Promise<string> }`. Há duas implementações intercambiáveis: `ClaudeClient` (chamada real à API) e `DemoClient` (fixtures pré-geradas). Sem chave, a UI usa o `DemoClient` e sinaliza "modo demo". Nos testes, clientes falsos simulam respostas e falhas.

As fixtures do demo são produzidas pelo script `npm run gerar-demo`, que roda o fluxo real sobre os exemplos fictícios, e devem ser revisadas por uma pessoa antes de commitar.

## Consequências

- Trocar o provedor de IA ou o modelo não afeta `core` nem `ui`.
- O demo mostra resultado real, não inventado à mão, e roda offline.
- No demo, o resultado independe do texto digitado — a interface avisa isso.
