# demo-seed Specification

## Purpose

A capacidade de popular uma instância com dados de demonstração realistas e coerentes de forma reexecutável, incluindo o bootstrap do usuário/conta demo e o reset idempotente.

## Requirements

### Requirement: Comando único de seed

O sistema SHALL fornecer um comando único (`npm run seed:demo`) que popula uma instância Supabase com dados de demonstração, sem exigir passos manuais adicionais além das variáveis de ambiente já necessárias para rodar o app.

#### Scenario: Seed em banco recém-migrado

- **WHEN** um operador roda `npm run seed:demo` contra um banco com as migrations aplicadas e vazio de conteúdo
- **THEN** o comando conclui com sucesso e a instância passa a ter uma conta demo populada e logável

#### Scenario: Variáveis ausentes

- **WHEN** `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` ou `ENCRYPTION_KEY` não estão definidas
- **THEN** o comando falha com uma mensagem clara indicando qual variável falta, sem escrever no banco

### Requirement: Bootstrap do usuário e conta demo

O seed SHALL criar (ou reaproveitar) um usuário de autenticação demo com credenciais conhecidas, resultando numa conta e num perfil `owner` associados, e SHALL usar essa conta como escopo de todo o conteúdo semeado.

#### Scenario: Primeiro seed cria o usuário

- **WHEN** o usuário demo ainda não existe
- **THEN** ele é criado com e-mail e senha conhecidos e uma conta com perfil `owner` é associada a ele

#### Scenario: Login funciona após o seed

- **WHEN** um operador acessa a aplicação com as credenciais demo após o seed
- **THEN** o login é bem-sucedido e leva ao dashboard populado

### Requirement: Reset idempotente

O seed SHALL ser reexecutável: rodá-lo novamente SHALL remover o conteúdo demo anterior e recriá-lo, deixando a instância num estado equivalente independentemente de quantas vezes foi executado.

#### Scenario: Reexecução não duplica

- **WHEN** o operador roda `npm run seed:demo` duas vezes seguidas
- **THEN** a conta demo contém um único conjunto de dados (sem duplicatas), equivalente ao de uma execução única

#### Scenario: Dados não-demo preservados

- **WHEN** o seed é executado numa instância que também tem outras contas/usuários
- **THEN** apenas o conteúdo da conta demo é removido e recriado; nenhum dado de outras contas é afetado

### Requirement: Conteúdo coeso e realista

O conteúdo semeado SHALL ser curado, em pt-BR, e coerente entre módulos, de forma que dashboard, inbox e funil reflitam a mesma narrativa (ex.: um deal referencia o contato e a conversa correspondentes). SHALL cobrir contatos (com tags, custom fields e notas), conversas com mensagens, um funil com etapas e deals, broadcasts com estatísticas, ao menos uma automação e um flow, templates de mensagem e notificações.

#### Scenario: Módulos populados após o seed

- **WHEN** o operador navega por inbox, contatos, funil, broadcasts, automações e flows após o seed
- **THEN** cada módulo exibe conteúdo realista e não um estado vazio

#### Scenario: Coerência cruzada

- **WHEN** um deal do funil é aberto
- **THEN** ele referencia um contato e (quando aplicável) uma conversa que também existem no inbox e na lista de contatos

### Requirement: Frescor temporal

Os timestamps do conteúdo semeado SHALL ser calculados relativos ao momento da execução, de modo que visões dependentes de janelas temporais recentes (volume diário, tempo de resposta) não apareçam vazias imediatamente após o seed.

#### Scenario: Dashboard com dados recentes

- **WHEN** o dashboard é aberto logo após o seed
- **THEN** os gráficos de volume e tempo de resposta exibem atividade dentro das janelas recentes (ex.: últimos 7/14 dias)

### Requirement: Estado de WhatsApp aparentemente conectado

O seed SHALL criar uma configuração de WhatsApp em modo dry-run (identificadores presentes e token cifrado placeholder) para que a interface exiba um estado conectado, sem depender de uma conexão real com a Meta.

#### Scenario: Inbox não pede conexão

- **WHEN** o operador abre o inbox após o seed
- **THEN** a interface apresenta o estado conectado em vez de solicitar a configuração de um número de WhatsApp

### Requirement: Salvaguarda contra produção

O seed SHALL evitar execução acidental em produção, exigindo um sinal explícito (variável de ambiente ou confirmação) antes de criar um usuário com senha conhecida quando o ambiente indicar produção.

#### Scenario: Bloqueio em produção sem sinal explícito

- **WHEN** o comando é executado num ambiente marcado como produção sem o sinal explícito de permissão
- **THEN** o comando aborta sem escrever no banco e explica como habilitar deliberadamente
