# ADR 0001 — Aplicação estática, sem backend

**Status:** aceita

## Contexto

O projeto é uma vitrine: o visitante precisa abrir um link e ver funcionando, sem criar conta e sem que o autor pague pelo uso. Um backend próprio exigiria hospedagem, proteção contra abuso do endpoint e custo de API por visitante.

## Decisão

Publicar uma SPA estática (React + TypeScript + Vite) no GitHub Pages. A chamada à IA sai direto do navegador, com a chave do próprio usuário. Sem login, sem banco de dados, sem histórico salvo.

## Consequências

- Custo zero de hospedagem e nada para manter no ar.
- O visitante sem chave usa o modo demo (ver ADR 0004).
- Sem proxy, a chave fica visível ao próprio usuário na rede do navegador — aceitável, pois é a chave dele (ver ADR 0002).
- Funcionalidades que dependem de servidor (histórico, integração direta com Jira/Azure DevOps, multiusuário) ficam fora do escopo.
