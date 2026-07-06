## 1. Esqueleto do script

- [x] 1.1 Adicionar `seed:demo` ao `package.json` (ex.: `tsx scripts/seed-demo.ts`) e a dependência de runner TS se necessária
- [x] 1.2 Criar `scripts/seed-demo.ts`: carregar env, validar `SUPABASE_SERVICE_ROLE_KEY`/`NEXT_PUBLIC_SUPABASE_URL`/`ENCRYPTION_KEY` (falha clara se faltar), instanciar client service_role
- [x] 1.3 Salvaguarda de produção: abortar sem escrever a menos que um sinal explícito (ex.: `ALLOW_DEMO_SEED=1`) esteja presente quando o ambiente for produção
- [x] 1.4 Helpers de tempo relativo (`daysAgo`/`hoursAgo`) ancorados em `now()` no início da execução

## 2. Bootstrap e reset

- [x] 2.1 Criar/recuperar usuário demo via Auth Admin API (`demo@wacrm.tech`, `email_confirm: true`, senha conhecida) e resolver o `account_id` do perfil criado pelo trigger
- [x] 2.2 Reset idempotente: apagar a conta demo (cascade limpa o conteúdo) antes de recriar; garantir que nenhuma outra conta seja tocada

## 3. Dados curados por módulo (ordem topológica)

- [x] 3.1 Contatos (~20, pt-BR) + tags + custom fields + notas
- [x] 3.2 Conversas (~8 threads curados) + mensagens (mix cliente/agente, status variado, alguns não-lidos/atribuídos), com `last_message_*`/`unread_count` consistentes
- [x] 3.3 Funil "Vendas" + etapas (Novo → Ganho) + ~12 deals espalhados (valores, moeda, etapa), referenciando contatos/conversas existentes
- [x] 3.4 2 broadcasts + recipients + contadores de entrega/leitura consistentes
- [x] 3.5 1–2 automações (+ steps + logs) e 1 flow simples (+ nós)
- [x] 3.6 3–4 message_templates + algumas notificações
- [x] 3.7 `whatsapp_config` dry-run (phone_number_id, waba_id, registered_at, token cifrado via `encrypt()`)

## 4. Validação

- [x] 4.1 Rodar `npm run seed:demo` contra o Supabase de dev — conclui sem erro
- [x] 4.2 Rodar duas vezes seguidas — confirmar ausência de duplicatas (reset idempotente)
- [x] 4.3 Logar como demo e conferir cada módulo (inbox, contatos, funil, broadcasts, automações, flows, dashboard) populado e coerente
- [x] 4.4 Confirmar dashboard com dados nas janelas recentes (timestamps relativos funcionando)
- [x] 4.5 `npm run typecheck` limpo no script
