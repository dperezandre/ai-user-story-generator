# ADR 0006 — IA local com o Claude Code, sem chave de API

**Status:** aceita

## Contexto

Quem usa o app para o próprio trabalho (importar um PDF ou Word de requisitos e receber as histórias quebradas) nem sempre tem ou quer usar uma chave de API. Um app que roda só no navegador não consegue gerar as histórias sozinho, e as alternativas sem chave eram regras fixas (qualidade bem inferior) ou um modelo dentro do navegador (download de GBs, exige GPU, erra formato e português).

## Decisão

Durante `npm run dev` e `npm run preview`, um middleware do Vite (`server/`) expõe `/api/status` e `/api/complete`, e repassa os pedidos ao **Claude Code instalado no computador** (login da própria pessoa), reaproveitando o `CliClient` dos scripts. No app, `useClient` escolhe: chave informada, depois IA local quando `/api/status` responde `disponivel: true`, e por fim o modo demo.

Salvaguardas do servidor local:

- aceita `POST` só com cabeçalho `Origin` igual ao host servido, para que outro site aberto no navegador não gaste o Claude do usuário;
- valida o formato do pedido e limita o corpo a 1 MB;
- chama o Claude Code sem ferramentas (`--tools ""`), a partir de uma pasta temporária e sem persistir sessão;
- existe só nos servidores de desenvolvimento e de preview, nunca no build publicado.

## Consequências

- Qualidade real da IA, sem chave, no computador da própria pessoa.
- No GitHub Pages não há servidor local: o visitante usa o modo demo ou a própria chave.
- Documentos grandes levam vários minutos, porque cada história é detalhada em uma chamada separada.
- Depende de o Claude Code estar instalado e logado (`CLAUDE_BIN` permite apontar outro caminho).
