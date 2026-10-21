# Rede Vita Saúde — Especificação de Requisitos

**Demanda:** Código único de procedimentos e tabelas negociadas por convênio
**Versão:** 1.0
**Observação:** documento fictício, criado apenas como exemplo para este projeto.

## 1. Objetivo

Permitir que os médicos solicitem exames e procedimentos por meio de um código único padronizado e criar uma tela administrativa para parametrizar o relacionamento (de-para) entre esse código único e as diferentes tabelas negociadas com cada convênio. Isso garante consistência entre as áreas assistenciais e o faturamento.

## 2. Justificativa

- **Padronização:** reduzir inconsistências causadas pelo uso de códigos e tabelas diferentes.
- **Eficiência:** diminuir erros e retrabalho nas solicitações de exames e procedimentos.
- **Receita:** permitir que médicos prescrevam exames e procedimentos ainda não negociados, ampliando a oferta de serviços.
- **Assistência:** dar mais clareza aos setores de Laboratório e Diagnóstico para executar corretamente o que foi solicitado.

## 3. Sistemas impactados

- Vita Prescrição Internação
- Vita Prescrição Pronto-Socorro
- Vita Faturamento
- Vita Diagnóstico

## 4. Requisitos

### 4.1 Chave liga/desliga por unidade

Criar, na tela de parâmetros (PARAM), uma propriedade com uma chave de liga/desliga para viabilizar a melhoria. A propriedade deve conter o código da unidade e a chave de ativação, permitindo controlar a funcionalidade individualmente por unidade.

### 4.2 Tela administrativa de parametrização

Nova tela administrativa com duas abas: **Procedimento Unificado** e **Procedimento Unificado – Pacote**.

### 4.3 Aba Procedimento Unificado

A aba é dividida em dois blocos.

**Bloco 1 — Cadastro do procedimento unificado**

- **Status:** ativo ou inativo. Define se o procedimento fica disponível para prescrição.
- **Classe do exame/procedimento:** lista suspensa com os valores:
  - 1 – Laboratório
  - 2 – Laboratório
  - 3 – Imagem
  - 7 – Procedimentos
  - 8 – Procedimentos
- **Permissão de prescrição:** Pronto-Socorro, Internação ou Ambos.
- **ID do procedimento:** código numérico interno único.
- **Nome do procedimento:** texto exibido para a equipe médica no momento da prescrição.

**Bloco 2 — Mapeamento de tabelas por convênio (de-para)**

Associa o procedimento unificado aos códigos das tabelas dos convênios, para fins de prescrição, faturamento e auditoria. Campos:

- **CBHPM:** código conforme a tabela CBHPM.
- **AMB:** código conforme a tabela AMB.
- **TUSS:** código conforme a tabela TUSS.
- **Código fictício:** código alternativo usado para controle.
- **Usuário:** preenchido automaticamente com o login de quem cadastrou ou alterou por último.
- **Data de registro:** preenchida automaticamente na gravação.

**Regras de validação**

- Todos os códigos (CBHPM, AMB, TUSS e fictício) devem existir previamente na tela de cadastro de códigos (TCOD).
- O sistema deve exibir uma mensagem de erro quando o código informado não for encontrado na TCOD.
- Usuário e data de registro devem ser gravados para fins de auditoria.

### 4.4 Aba Procedimento Unificado – Pacote

A aba é dividida em dois blocos.

**Bloco 1 — Cadastro do procedimento unificado**

- **Status:** ativo ou inativo. Define se o procedimento fica disponível para prescrição.
- **Classe do exame/procedimento:** lista suspensa com os valores:
  - 1 – Laboratório
  - 2 – Laboratório
  - 3 – Imagem
  - 7 – Procedimentos
  - 8 – Procedimentos
- **Permissão de prescrição:** Pronto-Socorro, Internação ou Ambos.
- **ID do procedimento:** código numérico interno único.
- **Nome do procedimento:** texto exibido para a equipe médica no momento da prescrição.

**Bloco 2 — Mapeamento de tabelas por convênio (de-para)**

Associa o procedimento unificado aos códigos das tabelas dos convênios, para fins de prescrição, faturamento e auditoria. O sistema deve permitir vincular múltiplos exames a um único pacote de procedimento. O pacote funciona como um agrupador lógico de exames, mantendo o vínculo individual de cada exame com os respectivos códigos nas tabelas dos convênios.
