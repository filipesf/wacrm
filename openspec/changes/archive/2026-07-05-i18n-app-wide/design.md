## Context

A infra de i18n (next-intl, cookie-based, `pt-BR` default) já está na `main` desde o piloto. Investigação do código estabeleceu a realidade arquitetural:

- **Mutações são client-side**: 15 componentes fazem `fetch('/api/...')`; existe **1 só** server action (`src/i18n/locale.ts`). Logo a tradução é quase toda `useTranslations` em Client Components; `getTranslations` (server) é marginal.
- **Toasts (201)**: ~163 literais, **26 com interpolação** (`` `...${x}...` ``), **12 passthrough** (`payload.error || 'fallback'`).
- **Erros internos** (`/api/whatsapp`) retornam strings em inglês ("Unauthorized", "Invalid JSON body") — raramente chegam à UI (o cliente tem fallback próprio).
- **`/api/v1`**: 11 arquivos = contrato público.
- **Formatação**: `date-fns` em 6 arquivos **sem** locale; `toLocaleDateString`/`toLocaleString` ~27×; `Intl.NumberFormat` 5×; `account.default_currency` referenciado 13×.

## Goals / Non-Goals

**Goals:**
- 100% do texto de UI dos módulos restantes traduzível em `en` e `pt-BR`.
- Toasts traduzidos, com interpolação/plural via ICU.
- Data/número/moeda respeitando locale + `default_currency`.
- Catálogos organizados para trabalho paralelo sem conflito.
- CI que impede regressão de paridade de chaves.

**Non-Goals:**
- Refatorar a API interna para códigos de erro (os 12 passthrough usam fallback traduzido do cliente; detalhe cru permanece).
- Traduzir o contrato do `/api/v1` ou erros crus de Supabase/Meta.
- Traduzir dados do usuário (contatos, mensagens).
- Novos idiomas além de `en`/`pt-BR` (a infra já suporta adicionar depois).
- RTL / `dir` (nenhum idioma RTL no escopo).

## Decisions

**1. Split de catálogo por módulo.** `messages/<locale>.json` → `messages/<locale>/<módulo>.json`, mesclados em `src/i18n/request.ts`. *Por quê:* 900 chaves num arquivo garantem conflito de merge no fan-out. *Alternativa:* arquivo único — rejeitada por não escalar em paralelo.

**2. Tradução client-first.** Usar `useTranslations` como padrão (bate com a arquitetura client-side); `getTranslations` só onde houver render server. *Por quê:* espelha onde o texto realmente vive. Evita reescrever fluxo client→fetch→route em server actions só por i18n.

**3. Passthrough: traduzir o fallback, manter o detalhe.** Para `toast.error(payload.error || 'X')`, traduzir `'X'`; `payload.error` (servidor, inglês) segue como detalhe. *Por quê:* só 12 sítios; refatorar a API em error codes é desproporcional. *Alternativa:* servidor traduz / error codes — adiada (fora de escopo, custo alto).

**4. Formatação via `useFormatter` do next-intl.** Migrar `toLocale*`/`Intl.*`/`date-fns` para o formatter locale-aware; moeda usa `account.default_currency`. *Por quê:* uma fonte de verdade de locale, consistente com as strings. *Alternativa:* passar locale ao date-fns manualmente — mais dispersão.

**5. Paridade de chaves no CI.** Script que compara as chaves achatadas de `en` vs `pt-BR` e falha em divergência. *Por quê:* next-intl não faz fallback entre locales; chave faltando = erro em runtime. Non-negociável em escala.

**6. Extração por módulo, fan-out após a infra.** Primeiro o split + CI + convenção; depois traduzir módulo a módulo (paralelizável). Ordem por tráfego: inbox → contacts → dashboard → pipelines → broadcasts → automations → flows → notifications → settings → layout/ui.

## Risks / Trade-offs

- **Chave faltando quebra runtime** → mitigado pelo CI de paridade (Decisão 5) + `en` como catálogo-fonte.
- **Interpolação vira concatenação errada** (plural pt-BR) → revisar os 26 template-literals caso a caso para ICU; incluir na checklist de extração.
- **Passthrough deixa detalhe em inglês** → aceito e documentado; cobre só 12 sítios de baixa frequência.
- **Volume (~117 telas, ~600–900 chaves)** → mitigado pelo split de namespace + fan-out por módulo + review por PR.
- **`ui/` genérico (23 componentes)** → muitos são primitivos sem texto; extrair só os que têm cópia embutida (empty states, confirmações), evitando over-translation.
- **Formatação com `default_currency` ausente** → fallback para um código padrão (ex.: `USD`/`BRL`) quando a conta não define.

## Migration Plan

1. Split dos catálogos + ajuste do `request.ts` + CI de paridade (base para o resto).
2. Helper/convenção de formatação locale-aware.
3. Traduzir módulo a módulo na ordem de tráfego (cada módulo = um PR revisável).
4. Sweep final: toasts residuais, aria-labels, placeholders, empty states.
5. Validar `typecheck`/`build` + smoke no navegador em `en` e `pt-BR` por módulo.

Rollback: por ser aditivo (chaves + `t()`), reverter um módulo é reverter seu PR; a infra permanece.

## Open Questions

- Formatação: migrar `date-fns` inteiramente para `useFormatter`, ou manter `date-fns` só onde há manipulação (não só formatação) de datas?
- `ui/` — quais componentes têm cópia embutida que merece extração vs. recebem texto por prop?
- Moeda default quando `account.default_currency` é nulo — qual código assumir?
