Atue como um Engenheiro de Software Full-Stack especialista no desenvolvimento de MVPs focados em finanças e gestão de empréstimos pessoais. 

Crie uma aplicação web completa, moderna, responsiva e intuitiva para Gestão de Empréstimos e Cobrança Automatizada via WhatsApp.

### 🎯 TECNOLOGIAS E ARQUITETURA (100% GRATUITO)
- Frontend/Backend: Next.js (App Router) com React, TypeScript e Tailwind CSS.
- Autenticação e Banco de Dados: Supabase ou Firebase (Login com Google / Gmail habilitado).
- WhatsApp: Estruturado para integração com API Node gratuita (ex: Evolution API / Baileys).
- Libs auxiliares: Lucide React (ícones), QRCode.react (para geração de PIX), Recharts ou similar.

---

### 🗄️ ESTRUTURA DO BANCO DE DADOS (MODELAGEM)
1. Clientes (Clients):
   - id, user_id (dono do sistema), nome, telefone, cpf, criado_em.

2. Empréstimos (Loans):
   - id, client_id, descricao, valor_emprestado, tipo_juros ('mensal', 'anual', 'sem_juros'), taxa_juros (%), qtd_parcelas, valor_parcela, valor_total_divida, valor_divida_atual, status ('ativo', 'quitado', 'atrasado'), data_inicio, criado_em.
   - **Campos de Juros por Atraso / Mora:**
     * tem_juros_atraso (boolean), taxa_multa_atraso (%), taxa_juros_mora_dia (%).

3. Parcelas e Pagamentos (Installments & Transactions):
   - id, loan_id, numero_parcela, valor_parcela_original, valor_parcela_atualizado, data_vencimento, status ('pendente', 'pago', 'parcialmente_pago', 'atrasado'), data_pagamento.
   - **Campos de Pagamento Parcial:**
     * valor_pago_efetivo, valor_remanescente, juros_aplicados_sobre_remanescente.

4. Configurações de Mensagens e Sistema (Settings / Templates):
   - user_id, dia_cobranca_padrao (ex: dia 10), chave_pix (CPF do usuário).
   - template_lembrete: Texto customizado para o dia do vencimento.
   - template_agradecimento: Texto customizado para confirmação de pagamento (total ou parcial).
   - template_cobranca_atraso: Texto customizado para cobrar parcelas vencidas com juros.

---

### 💻 MÓDULOS E TELAS DA APLICAÇÃO

#### 1. Autenticação (Login)
- Tela de login simples com suporte a "Entrar com Google (Gmail)".
- Proteção de rotas para garantir que cada usuário veja apenas seus próprios clientes e empréstimos.

#### 2. Dashboard & Gestão de Empréstimos
- Visão Geral (Cards de Métricas): Total Emprestado, Total a Receber, Total Recebido, Clientes Inadimplentes.
- Cadastro de Clientes e Empréstimos:
  - Permite cadastrar cliente (Nome, Telefone, CPF).
  - Um cliente pode ter VÁRIOS empréstimos ativos simultaneamente.
  - Cada empréstimo possui: Descrição opcional, Valor emprestado, Opção com/sem juros (% mensal ou anual), Quantidade de parcelas e Configuração de Juros/Multa por Atraso em caso de inadimplência.
  - Exibição de: Valor Emprestado, Valor Total da Dívida, Valor Atual da Dívida (Valor Total - Soma do pago), Valor e Vencimento das Parcelas.
- Modal de Confirmação de Pagamento (Pagamento Total ou Parcial):
  - Ao clicar em "Confirmar Pagamento Recebido" na parcela:
    * Abre um **Modal** que exibe o valor esperado (ex: R$ 1.000,00).
    * Campo editável **"Valor Efectivamente Pago"** (já preenchido por padrão com o valor da parcela/dívida).
    * O usuário pode alterar o valor caso o cliente tenha pago a mais ou a menos.
    * **Lógica para Pagamento Parcial (se valor pago < valor devido):**
      1. Abate o valor efetivamente pago da dívida.
      2. Calcula o saldo remanescente que faltou ser pago.
      3. Apresenta opção de **aplicar juros sobre o saldo restante**, recalculando o saldo devedor atualizado e incorporando o restante juros na dívida do cliente.
  - Ao confirmar a modal, o sistema atualiza o status, recalcula a dívida total atual e dispara (ou abre o link) da mensagem de agradecimento/recibo via WhatsApp.

#### 3. Simulador de Empréstimo (Aba/Tela Independente)
- Interface limpa e rápida para simulações:
  - Campos: Valor Solicitado, Juros (Sem juros, Taxa Mensal % ou Taxa Anual %), Quantidade de Parcelas (se anual, informar anos e indicar conversão para 12, 24, 36 meses), Simulação opcional de Multa/Juros por Atraso.
  - Resultados em tempo real: Valor Total a Pagar, Valor por Parcela e Cronograma de Pagamentos.
  - Botão "Gerar Empréstimo a partir da Simulação" para converter os dados direto no cadastro de um cliente.

#### 4. Gerenciador de Templates de Mensagens (Configurações)
- Tela para personalizar as mensagens automáticas/semi-automáticas do sistema.
- Lista de Variáveis Dinâmicas disponíveis (com botão de clicar para copiar):
  - {NOME}: Nome do Cliente
  - {DESCRICAO}: Descrição do Empréstimo
  - {VALOR_PARCELA}: Valor original da parcela
  - {VALOR_PAGO}: Valor efetivamente pago pelo cliente no modal
  - {VALOR_PARCELA_COM_JUROS}: Valor da parcela atualizado com juros de atraso
  - {DIVIDA_ATUAL}: Saldo devedor restante atualizado
  - {NUM_PARCELA}: Número da parcela (ex: 2/10)
  - {VENCIMENTO}: Data de vencimento
  - {CHAVE_PIX}: Chave PIX cadastrada (CPF)
- Módulos de edição de mensagens com os seguintes VALORES DEFAULT (Padrão):
  1. **Lembrete de Vencimento:**
     "Olá, {NOME}! Tudo bem? Passando para lembrar que a parcela {NUM_PARCELA} do seu empréstimo ({DESCRICAO}) no valor de R$ {VALOR_PARCELA} vence hoje. Sua dívida total restante é de R$ {DIVIDA_ATUAL}. Chave PIX: {CHAVE_PIX}"
  2. **Agradecimento e Confirmação de Pagamento:**
     "Olá, {NOME}! Confirmamos o recebimento do pagamento de R$ {VALOR_PAGO}. Sua dívida total atualizada agora é de R$ {DIVIDA_ATUAL}. Muito obrigado!"
  3. **Cobrança de Atraso (com Juros):**
     "Olá, {NOME}. Identificamos que a sua parcela ({DESCRICAO}) com vencimento em {VENCIMENTO} no valor original de R$ {VALOR_PARCELA} está pendente. Com o juro de atraso, o valor atualizado para pagamento hoje é R$ {VALOR_PARCELA_COM_JUROS}. Por favor, assim que realizar o pagamento, nos envie o comprovante. Chave PIX: {CHAVE_PIX}"
- Botão "Restaurar Mensagens Padrão".

#### 5. Disparador e Automação de Mensagens no WhatsApp
- Régua de Cobrança (Data Configurável - Ex: Todo dia 10):
  - No dia configurado, gera a lista de cobrança com os valores calculados de cada cliente.
  - Anexa o QR Code PIX / Copia e Cola gerado dinamicamente com a chave PIX (CPF) referente ao valor exato cobrado.
  - **Fluxo de Envio:**
    1. Ação Manual/Semi-automática: Botão "Enviar via WhatsApp Web" (`wa.me` com o texto já preenchido baseado no template).
    2. Backend/Webhook API: Endpoint (`/api/whatsapp/send`) pronto para conectar com serviços como Evolution API ou Baileys para disparos 100% automáticos via Cron Job no dia seguinte.

---

### 🎨 REQUISITOS DE DESIGN E UX
- Interface responsiva (Mobile First e Desktop).
- Status com cores indicativas: Verde (Pago/Parcial), Amarelo (Pendente/A vencer), Vermelho (Atrasado/Com Juros).
- Formatação automática de moeda (R$ BRL) e máscaras para Telefone e CPF.

Gere o código modularizado, limpo e pronto para produção, incluindo scripts de migration para banco de dados e rotas de API.
