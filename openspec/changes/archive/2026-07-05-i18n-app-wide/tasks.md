## 1. Infra de escala (base para o resto)

- [x] 1.1 Migrar `messages/en.json` e `messages/pt-BR.json` para diretórios por locale com um arquivo por módulo (`messages/<locale>/common.json`, `auth.json`, `settings.json`, etc.), preservando as chaves do piloto
- [x] 1.2 Ajustar `src/i18n/request.ts` para carregar e mesclar todos os arquivos de módulo do locale ativo
- [x] 1.3 Criar script de verificação de paridade de chaves entre locales (`scripts/i18n-parity.mjs` ou similar) e um npm script `i18n:check`
- [x] 1.4 Adicionar o `i18n:check` ao workflow de CI

## 2. Formatação locale-aware

- [x] 2.1 Criar helper(s) de formatação usando `useFormatter` do next-intl para data, número e moeda (moeda a partir de `account.default_currency`, com fallback quando nulo)
- [x] 2.2 Substituir `toLocaleDateString`/`toLocaleString`/`Intl.NumberFormat`/`date-fns` sem locale pelos helpers nos ~30 call sites

## 3. Módulos (ordem por tráfego)

- [x] 3.1 Traduzir **inbox** (`src/components/inbox/*`, `src/app/(dashboard)/inbox`)
- [x] 3.2 Traduzir **contacts** (`src/components/contacts/*`, página)
- [x] 3.3 Traduzir **dashboard** (`src/components/dashboard/*`, página)
- [x] 3.4 Traduzir **pipelines** (`src/components/pipelines/*`, página)
- [x] 3.5 Traduzir **broadcasts** (`src/components/broadcasts/*`, páginas new/[id])
- [x] 3.6 Traduzir **automations** (`src/components/automations/*`, páginas edit/logs/new)
- [x] 3.7 Traduzir **flows** (`src/components/flows/*`, páginas [id]/runs)
- [x] 3.8 Traduzir **notifications** (`src/components/*`, página notifications)
- [x] 3.9 Traduzir **settings restante** (`src/components/settings/*` além de appearance)
- [x] 3.10 Traduzir **layout/navegação** (`src/components/layout/*`) e demais páginas (signup, forgot-password, join)

## 4. Toasts e camada transversal

- [x] 4.1 Traduzir os ~163 toasts literais nos módulos
- [x] 4.2 Converter os 26 toasts com interpolação para chaves ICU (plural/variáveis)
- [x] 4.3 Traduzir os fallbacks dos 12 toasts passthrough (mantendo o detalhe cru do servidor)
- [x] 4.4 Sweep de `placeholder`, `aria-label` e estados vazios remanescentes
- [x] 4.5 Extrair a cópia embutida dos componentes `ui/` que a contêm (empty states, confirmações), deixando primitivos sem texto

## 5. Validação

- [x] 5.1 Rodar `npm run i18n:check` (paridade) e resolver divergências
- [x] 5.2 Rodar `npm run typecheck` e corrigir tipos
- [x] 5.3 Rodar `npm run build` (compatibilidade Turbopack/Next 16)
- [~] 5.4 Smoke no navegador por módulo em `en` e `pt-BR` (incluindo datas/moeda formatadas) (auth pages + login smoke em en/pt-BR OK; módulos autenticados validados via build+typecheck — smoke manual pendente por falta de conta de teste)
- [x] 5.5 Confirmar que `/api/v1` e dados do usuário permanecem sem tradução

## Gaps residuais (libs compartilhadas — follow-up)

Strings de baixa visibilidade ainda em inglês, vindas de libs compartilhadas que precisam de refactor próprio (retornar chave em vez de label):
- `src/lib/api-keys/scopes` — `SCOPE_DESCRIPTIONS` (descrições dos escopos de API key)
- `src/lib/presence` — `presenceLabel` (tooltip/aria de presença)
- `src/lib/currency` — nomes das moedas em `CURRENCIES` (dropdown do seletor)
- `src/lib/flows/*` — mensagens de validação e labels de aresta/slot do editor de fluxo

Já resolvidos no sweep: `GatedButton` (tooltip "somente leitura"), `broadcast-status` e `template-status` (chips de status).
