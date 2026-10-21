# Gerador de Histórias de Usuário com IA

> Cole uma necessidade ou um documento de requisitos da área de negócio e receba épico, histórias de usuário com critérios de aceite em Gherkin, avaliação INVEST, perguntas de refinamento e — o mais importante — as **lacunas do documento**, prontas para levar ao negócio.

**[Abrir o app](https://dperezandre.github.io/ai-user-story-generator/)** · funciona **sem chave de API** em modo demo

## O problema

O refinamento de backlog consome horas do Product Owner: ler documentos longos, fatiar em histórias pequenas, escrever critérios de aceite verificáveis e descobrir, só na reunião com o time, que faltava uma regra. O resultado varia de pessoa para pessoa e as dúvidas chegam tarde.

## O que o app faz

**Documento de requisitos → épico, histórias e lacunas**

- Fatia o documento em histórias pequenas, na **ordem de entrega** que destrava as demais, com dependências entre elas.
- Escreve critérios de aceite em **Gherkin** (incluindo cenários de erro) e avalia cada história pelo **INVEST**, dizendo o que está fraco.
- Aponta **lacunas e ambiguidades** no documento — valores repetidos, termos sem definição, blocos duplicados, regras e mensagens faltando — com a pergunta pronta para o negócio.
- Tem dois **níveis de detalhe**: **Enxuto** (padrão, de 12 a 20 histórias agrupadas por fluxo) e **Completo** (histórias bem finas, todos os cenários). As histórias são detalhadas **em paralelo**: um documento de 28 mil caracteres foi quebrado em 16 histórias em cerca de 3 minutos, contra 27 minutos no modo completo sequencial.
- Mostra os **trechos do documento sem história**: uma checagem aproximada, sem IA, das linhas do documento que aparecem pouco nas histórias e lacunas, para o PO conferir o que pode ter ficado de fora.
- Aceita texto colado ou arquivos `.pdf`, `.docx`, `.md` e `.txt` (lidos no navegador; PDF escaneado, sem texto, não funciona, e `.doc` antigo precisa ser salvo como `.docx`).

**Necessidade curta → uma história completa**, com perguntas de refinamento e sugestão de quebra quando a história é grande.

Tudo é editável na tela e exportável em **Markdown** ou em formato pronto para colar no **Azure DevOps/Jira**.

## Como usar

1. **Online (GitHub Pages):** sem chave, o app roda em **modo demo** com dois exemplos prontos (um documento fictício de requisitos e uma necessidade curta). Para gerar resultados reais, cole sua **chave da API Claude**.
2. **No seu computador, sem chave:** com o [Claude Code](https://claude.com/claude-code) instalado e logado, rode `npm run dev`. O app detecta a **IA local** (selo "IA local") e quebra os seus documentos de verdade, sem chave de API. Importe um PDF ou Word, ou cole o texto, e clique em **Analisar documento**. Documentos grandes levam alguns minutos, e a tela mostra o progresso.

## O que um PO ganha com isso

- **Tempo:** a primeira versão do refinamento sai em minutos, e o PO gasta energia em decidir, não em redigir.
- **Padronização:** toda história sai com o mesmo rigor (INVEST, Gherkin, cenário de erro).
- **Menos surpresa:** as lacunas aparecem *antes* da reunião de refinamento, como perguntas objetivas.
- **Rastreabilidade:** cada história aponta o trecho do documento que a originou.

## Decisões de arquitetura

Aplicação estática (React + TypeScript + Vite), sem backend. As decisões estão registradas como ADRs:

1. [App estático, sem backend](docs/adr/0001-app-estatico-sem-backend.md)
2. [Chave de API apenas em memória](docs/adr/0002-chave-em-memoria.md)
3. [Saída em JSON validada por schema](docs/adr/0003-saida-json-validada.md)
4. [Interface `LlmClient` e modo demo](docs/adr/0004-interface-llmclient-e-modo-demo.md)
5. [Prompts versionados e avaliados](docs/adr/0005-prompts-versionados-e-avaliados.md)
6. [IA local com o Claude Code, sem chave de API](docs/adr/0006-ia-local-com-claude-code.md)

Diagramas C4 em [docs/c4.md](docs/c4.md).

## Privacidade

- A chave vive **somente na memória da aba**: não é gravada em `localStorage`, cookie ou URL, e a chamada vai direto do navegador para a API da Anthropic.
- Não há servidor do autor, analytics nem rastreadores. No modo "IA local", o servidor é o seu próprio `npm run dev`, que só aceita pedidos da própria página.
- **Não cole dados sensíveis, de pacientes ou confidenciais.** Todos os exemplos do repositório são fictícios.

## Qualidade

- Testes unitários e de componentes com Vitest e Testing Library (`npm test`).
- CI no GitHub Actions: lint, typecheck, testes e build a cada push; deploy automático no GitHub Pages.
- **Avaliador de prompts** ([evals/](evals/README.md)): casos fictícios que medem conformidade com o schema, cenários Gherkin, cenário de erro, lacunas detectadas e consistência de ids, para comparar versões do prompt.

## Rodar localmente

```bash
npm ci
npm run dev      # app em modo desenvolvimento
npm test         # testes
npm run build    # build de produção
```

## Autor

**André Perez** — Product Owner e Tech Lead · [LinkedIn](https://www.linkedin.com/in/andrepperez)

Licença [MIT](LICENSE).
