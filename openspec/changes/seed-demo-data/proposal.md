## Why

Não há como levantar rapidamente uma instância do wacrm com conteúdo que pareça real — um banco recém-migrado fica vazio, o que impossibilita demonstrar o produto (dashboard, inbox, funil, broadcasts) sem conectar um WhatsApp real e trocar mensagens de verdade. Um seed de demo resolve isso com um comando.

## What Changes

- Adiciona um script **`scripts/seed-demo.ts`** (executado via `npm run seed:demo`) que popula um banco Supabase com um conjunto coeso e curado de dados de demonstração.
- **Usuário demo**: cria (ou reaproveita) `demo@wacrm.tech` com senha conhecida via Supabase Auth Admin API; o trigger `handle_new_user` cria a conta e o perfil `owner` automaticamente.
- **Reexecutável / reset**: antes de semear, apaga a conta demo (o `ON DELETE CASCADE` em `account_id` limpa todo o conteúdo), então recria — idempotente.
- **Conteúdo curado, coerente e em pt-BR**: contatos (com tags, custom fields, notas), conversas com threads escritos à mão, funil com etapas e deals, broadcasts com estatísticas, automações e um flow, templates, notificações e um `whatsapp_config` dry-run.
- **Timestamps relativos a `now()`** no momento do seed, para o dashboard (volume diário, tempo de resposta) nunca aparecer vazio.
- **Fora de escopo (simplicidade)**: sem geração aleatória/faker, sem cron de refresh, sem conexão real de WhatsApp, sem hardening de instância pública compartilhada.

## Capabilities

### New Capabilities
- `demo-seed`: a capacidade de popular uma instância com dados de demonstração realistas e coerentes de forma reexecutável, incluindo o bootstrap do usuário/conta demo e o reset idempotente.

### Modified Capabilities
<!-- Nenhuma. -->

## Impact

- **Novos arquivos**: `scripts/seed-demo.ts` (+ possíveis módulos de dados curados em `scripts/demo/`), entrada `seed:demo` em `package.json`.
- **Env**: reusa `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` e `ENCRYPTION_KEY` (já presentes). Nenhuma variável nova.
- **Banco**: escreve apenas sob a conta demo; usa service_role (bypassa RLS). Não altera schema nem migrations.
- **Sem impacto** em produto, API pública, webhooks ou build.
- **Aviso operacional**: o script cria um usuário com senha conhecida — destinado a ambientes de demo/dev, não produção.
