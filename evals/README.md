# Avaliador de prompts

Trata prompt como produto: cada mudança nos arquivos de `src/prompts/` pode ser comparada com a versão anterior.

```bash
npm run eval                                  # usa o Claude Code instalado, sem chave
ANTHROPIC_API_KEY=sk-ant-... npm run eval     # ou a API direta
```

O que cada caso mede:

- **Casos curtos:** a resposta valida o schema, tem pelo menos 2 cenários Gherkin e ao menos um cenário de erro.
- **Casos de documento:** a resposta valida o schema, aponta o mínimo de lacunas esperado e mantém ids consistentes (`ordemSugerida` e `dependeDe` só citam histórias existentes).

O resultado é gravado em `evals/results/<data>-<versão dos prompts>.json`, o que permite comparar versões. A execução é manual porque consome a API.

Todos os casos são fictícios.
