## Context

O wacrm é um template Next.js 16 (App Router, React 19) com Supabase. Toda a UI (~118 componentes `.tsx`) tem strings em inglês hardcoded. Não existe nenhuma infra de i18n: sem dependências, sem segmento `[lang]`, sem catálogos de mensagens. O `src/middleware.ts` já executa lógica sensível de sessão do Supabase (refresh de token + cookies, ver bug #288) e route groups `(auth)` / `(dashboard)`.

Restrições relevantes:
- A doc nativa do Next 16 sugere `app/[lang]/` + dictionaries, mas isso exigiria mover toda a árvore de rotas e compor manualmente com o middleware de sessão — alto risco.
- O wacrm tem muitos client components (builders de automação/flows, dnd, inbox), onde o padrão nativo de dictionaries (passar via props) é penoso.

## Goals / Non-Goals

**Goals:**
- Infra de i18n que funcione em Server **e** Client Components sem tocar na árvore de rotas nem no middleware Supabase.
- Suporte a `en` e `pt-BR`, com `pt-BR` como default.
- Persistência da escolha do usuário e re-render server-side imediato ao trocar.
- Adicionar novo idioma = 1 arquivo JSON + 1 entrada de config.
- Um módulo piloto (login + settings/appearance) totalmente traduzido como padrão de referência para os demais.

**Non-Goals:**
- Traduzir os demais módulos (inbox, contacts, pipelines, broadcasts, automations, flows, dashboard, notifications) — fases seguintes.
- URLs localizadas / roteamento por locale (`/pt-BR/...`) — desnecessário para app privada logada.
- Localização de conteúdo dinâmico do usuário (nomes de contatos, mensagens do WhatsApp).
- Tradução automática ou pipeline de tradução externa.

## Decisions

**1. next-intl em vez do padrão nativo (dictionaries + `[lang]`).**
next-intl funciona nativamente em client components (via `NextIntlClientProvider` + `useTranslations`) e server components (`getTranslations`), tem ICU e formatação de datas/números. O padrão nativo forçaria mover 100% das rotas para `[lang]/` e passar o dicionário manualmente aos muitos client components. *Alternativa considerada:* dictionaries nativas — rejeitada pelo custo em client components e pela reescrita de rotas.

**2. Locale por cookie, sem i18n routing.**
O locale ativo vive num cookie (`locale`), lido em `src/i18n/request.ts` via `getRequestConfig`. Não há segmento `[lang]` na URL. Isso mantém a árvore de rotas e o `middleware.ts` intactos. Como o CRM é app privada logada, não há requisito de SEO por URL localizada. *Alternativa considerada:* prefixo na URL — rejeitada por exigir reescrita de rotas e composição com o middleware de sessão.

**3. `pt-BR` como default.**
Público primário é Brasil. `en` permanece como catálogo-fonte e fallback. Trocar o default é uma constante em `src/i18n/config.ts`.

**4. Troca de idioma via Server Action + `revalidatePath('/', 'layout')`.**
Um seletor client chama a action `setUserLocale`, que grava o cookie e revalida o layout, forçando re-render server-side de todas as strings. Simples e sem estado client duplicado.

**5. Estrutura de catálogos por namespace.**
`messages/<locale>.json` organizados por namespace hierárquico (`auth.login.*`, `settings.appearance.*`), espelhando a árvore de módulos. Facilita divisão do trabalho por módulo nas fases seguintes.

## Risks / Trade-offs

- **Ler cookie no `getRequestConfig` torna rotas dinâmicas** → a maior parte do dashboard já é dinâmica (auth Supabase); o login perde prerender estático, impacto desprezível para app logada.
- **Divergência entre catálogos (`en` vs `pt-BR`)** → chaves faltando quebram silenciosamente. Mitigação: `en` é a fonte canônica; validar paridade de chaves no CI numa fase futura.
- **Escopo grande de tradução (118 telas)** → mitigado pela entrega em fases; esta change entrega só infra + piloto, com namespaces prontos para fatiar o resto.
- **Plugin next-intl + Turbopack (Next 16)** → risco de incompatibilidade de build. Mitigação: validar `typecheck` + `build` + `dev` ao final desta change antes de seguir.
- **Conteúdo do usuário não é traduzido** → esperado (é dado, não UI); documentar como Non-Goal.

## Migration Plan

1. Instalar `next-intl`, adicionar `src/i18n/*` e o plugin em `next.config.ts`.
2. Criar `messages/en.json` + `messages/pt-BR.json` (namespaces do piloto).
3. Integrar `NextIntlClientProvider` no `RootLayout` + `lang` dinâmico.
4. Traduzir o piloto (login + appearance) e adicionar o seletor de idioma.
5. Validar `typecheck`/`build`/`dev` e a troca de idioma end-to-end.

Rollback: remover o wrapper `withNextIntl`, os arquivos `src/i18n/*` e reverter os 3 arquivos do piloto; a dependência pode ficar instalada sem efeito.

## Open Questions

- Validação de paridade de chaves entre catálogos deve virar check de CI? (provável fase futura)
- Ordem de tradução dos módulos nas próximas fases (sugestão: por tráfego — inbox → contacts → dashboard → resto).
