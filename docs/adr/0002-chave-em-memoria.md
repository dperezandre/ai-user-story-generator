# ADR 0002 — Chave de API apenas em memória

**Status:** aceita

## Contexto

Sem backend, o usuário precisa informar a própria chave de API. Persisti-la no navegador amplia o risco: extensões, scripts de terceiros ou um computador compartilhado poderiam lê-la.

## Decisão

A chave é mantida somente no estado React da aba. Não é gravada em `localStorage`, `sessionStorage`, cookie ou URL, nem registrada em log, nem incluída em mensagens de erro. O campo é do tipo senha. Há um teste automatizado que garante que nada é gravado nos armazenamentos do navegador.

## Consequências

- Ao recarregar a página, o usuário precisa informar a chave de novo (conveniência sacrificada por segurança).
- O app exibe um aviso para não colar dados sensíveis ou de pacientes.
- Sem analytics nem rastreadores, para que nada do conteúdo digitado saia do navegador exceto para a API.
