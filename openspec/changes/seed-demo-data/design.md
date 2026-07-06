## Context

Investigação do schema estabeleceu as restrições que moldam o seed:

- **Multitenancy**: toda tabela de domínio tem `account_id` (FK → `accounts`, `ON DELETE CASCADE`). Apagar a conta demo zera todo o conteúdo.
- **Bootstrap**: `accounts.owner_user_id → auth.users(id)`. O trigger `handle_new_user` (migration 017) cria conta + perfil `owner` no signup. Logo o usuário demo precisa existir em `auth.users` — via Supabase Auth Admin API.
- **RLS**: ativo em tudo; `service_role` bypassa. O repo já usa `service_role` no webhook/automations.
- **Cadeias de FK**: `conversations(contact_id)` → `messages`; `deals(stage_id, contact_id, conversation_id?)`; `broadcast_recipients(broadcast_id, contact_id)`; `pipelines → pipeline_stages → deals`.
- **Dashboard é derivado**: volume/tempo-de-resposta vêm de `messages.created_at` e `conversations.last_message_at` relativos a `now()`.
- **WhatsApp**: `whatsapp_config` tem `access_token` cifrado (AES-256-GCM via `encrypt()` em `src/lib/whatsapp/*`), `phone_number_id`, `waba_id`, `registered_at`. O inbox tem guards em `whatsapp_config`.
- Não existe nenhum seed/fixture/factory no repo hoje.

## Goals / Non-Goals

**Goals:**
- Um comando (`npm run seed:demo`) popula uma instância com conteúdo coeso e realista em pt-BR.
- Reexecutável: reset idempotente via delete-da-conta + recriação.
- Dashboard, inbox e funil contam a mesma história (dados cruzados coerentes).
- Gráficos nunca vazios (timestamps relativos a `now()`).

**Non-Goals:**
- Geração aleatória/faker; refresh via cron; conexão real de WhatsApp; hardening de instância pública; alteração de schema/migrations; uso em produção.

## Decisions

**1. Script TS (`scripts/seed-demo.ts`) com service_role.**
É o único caminho que cria o usuário de auth (Admin API), reusa `encrypt()` para o token dry-run, e computa timestamps relativos — coisas inviáveis num `seed.sql` puro. Alinha com o uso existente de service_role. *Alternativa:* `supabase/seed.sql` — rejeitada (auth.users + token cifrado + lógica de tempo em SQL puro é frágil).

**2. Usuário demo via Admin API + trigger.**
`supabase.auth.admin.createUser({ email: 'demo@wacrm.tech', password, email_confirm: true })` dispara `handle_new_user`, que cria conta + perfil. O script então lê `profiles.account_id` do usuário demo para carimbar o resto. *Alternativa:* inserir em `auth.users` via SQL — rejeitada (hashing/fragilidade).

**3. Reset = apagar a conta demo, depois recriar.**
Como `account_id` cascateia, um `DELETE FROM accounts WHERE id = <demo>` limpa contatos, conversas, deals, tudo. Idempotência sem lógica de upsert por tabela. O usuário de auth pode ser reaproveitado (recupera se já existe) ou recriado.

**4. Conteúdo curado em módulos de dados.**
Threads de conversa e contatos escritos à mão (coerentes) em `scripts/demo/*.ts`, não gerados. Volume moderado (~20 contatos, ~8 conversas, ~12 deals) — suficiente para encher listas e gráficos sem parecer sintético.

**5. Timestamps relativos.**
Um helper `daysAgo(n)`/`hoursAgo(n)` calculado a partir de `now()` no início do seed. Mensagens espalhadas nos últimos ~14 dias; deals e broadcasts idem. Mantém o dashboard vivo em qualquer data de execução.

**6. `whatsapp_config` dry-run.**
Semear `phone_number_id`, `waba_id`, `registered_at` e um `access_token` cifrado placeholder (via `encrypt()`), para o inbox parecer conectado. Enviar mensagem real falha (esperado no demo).

## Risks / Trade-offs

- **Usuário com senha conhecida** → risco se rodado em produção. Mitigação: documentar como demo/dev-only; o script pode abortar se `NODE_ENV==='production'` sem flag explícita.
- **Ordem de inserção / FKs** → inserir na ordem topológica (contacts antes de conversations antes de messages; pipelines→stages→deals). Mitigação: o script segue a ordem do grafo.
- **Colunas legadas `user_id`** em domain tables (identificam o agente-dono) → precisam apontar para o usuário demo, não só `account_id`.
- **Drift de schema** → o seed referencia colunas atuais; se uma migration futura mudar shape, o script quebra. Mitigação: reusar os tipos TS do app onde possível.
- **`whatsapp_config` dry-run com token inválido** → se algum fluxo tentar usar o token, falha. Aceitável no demo; nenhum envio automático dispara sem ação do usuário.
- **Contadores agregados** (ex.: `broadcasts.*_count`, `conversations.unread_count`) mantidos por triggers/RPCs → o seed deve setar valores consistentes com as linhas filhas inseridas, ou deixar os triggers calcularem.

## Migration Plan

1. Adicionar `seed:demo` ao `package.json` e o script base (bootstrap do usuário + reset).
2. Módulos de dados curados por área (contatos, conversas, funil, broadcasts, automações, flow, templates, notificações).
3. Inserção em ordem topológica com timestamps relativos.
4. `whatsapp_config` dry-run.
5. Rodar contra o Supabase de dev, logar como demo e conferir cada módulo.

Rollback: `npm run seed:demo` novamente (reset) ou apagar a conta demo manualmente. O script não toca dados não-demo.

## Open Questions

- Guard de produção: abortar por `NODE_ENV`, por confirmação interativa, ou por env var explícita (`ALLOW_DEMO_SEED=1`)?
- Deixar contadores agregados para os triggers calcularem ou setar explicitamente?
- Senha demo: fixa no script (conveniência) ou lida de env (`DEMO_PASSWORD`)?
