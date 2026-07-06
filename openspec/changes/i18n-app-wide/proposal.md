## Why

O piloto (`add-i18n-next-intl`) provou a infra de i18n e traduziu login + Aparência, mas ~117 telas continuam com texto em inglês hardcoded. Enquanto a cobertura for parcial, a interface fica bilíngue pela metade (um menu em pt-BR ao lado de um toast em inglês), o que é pior que 100% inglês. Esta change leva o i18n à aplicação inteira, reusando a infra já mergeada.

## What Changes

- **Cobertura total de UI**: externalizar todo o texto visível dos módulos restantes — inbox, contacts, dashboard, pipelines, broadcasts, automations, flows, notifications, restante de settings, layout/navegação e componentes `ui/` — para os catálogos `messages/`.
- **Toasts (201)**: traduzir os ~163 literais e converter os **26 com interpolação** para mensagens ICU (plural/variáveis); para os **12 passthrough** (`payload.error || 'fallback'`), traduzir o fallback do cliente — o detalhe cru do servidor permanece como está.
- **Formatação locale-aware**: adotar o `useFormatter` do next-intl (backed by `Intl`) para datas, números e moeda nos ~30 call sites (`toLocaleDateString`, `toLocaleString`, `Intl.NumberFormat`), respeitando o locale ativo e o `account.default_currency`.
- **Split de namespaces**: migrar `messages/<locale>.json` de arquivo único para um diretório por locale com um arquivo por módulo (`messages/<locale>/inbox.json`, etc.), para permitir trabalho paralelo sem conflito de merge.
- **Guard-rail de paridade**: adicionar um check de CI que falha se as chaves de `en` e `pt-BR` divergirem (next-intl não faz fallback entre locales — chave faltando quebra em runtime).
- **Fora de escopo (BREAKING evitado)**: mensagens de erro do `/api/v1` (contrato público) e erros crus de Supabase/Meta permanecem em inglês; dados do usuário (contatos, mensagens do WhatsApp) nunca são traduzidos; nenhuma refatoração da API interna em códigos de erro.

## Capabilities

### New Capabilities
<!-- Nenhuma capability nova; estende a existente. -->

### Modified Capabilities
- `internationalization`: adiciona requisitos de cobertura total de UI, tradução de toasts (incluindo ICU e passthrough), formatação locale-aware de data/número/moeda, organização de catálogos por módulo, fronteiras explícitas de não-tradução, e o check de paridade de chaves. Os requisitos do piloto continuam válidos.

## Impact

- **Arquivos alterados**: ~117 componentes `.tsx` em `src/components/*` e `src/app/**`; ~30 call sites de formatação.
- **Catálogos**: `messages/en.json` + `messages/pt-BR.json` reorganizados em `messages/en/*.json` + `messages/pt-BR/*.json`; `src/i18n/request.ts` passa a mesclar os arquivos por módulo.
- **CI**: novo script de verificação de paridade (`package.json` + workflow).
- **Sem impacto**: schema do banco, contrato do `/api/v1`, webhooks, fluxo de WhatsApp no fio.
- **Dependências**: nenhuma nova (next-intl já instalado).
