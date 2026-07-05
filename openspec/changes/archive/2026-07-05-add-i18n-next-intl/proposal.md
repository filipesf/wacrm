## Why

O wacrm hoje tem todo o texto de interface em inglês hardcoded nas ~118 telas, sem nenhuma infraestrutura de i18n. Como o template é distribuído para ser adotado e rebrandeado, precisa suportar múltiplos idiomas — e o primeiro público-alvo (Brasil) precisa da interface em pt-BR. Sem uma camada de i18n, cada fork teria que reescrever strings manualmente e perderia o inglês no processo.

## What Changes

- Adiciona a biblioteca **next-intl** com estratégia de **locale por cookie** (sem segmento `[lang]` na URL), preservando a árvore de rotas atual e o `middleware.ts` de sessão do Supabase intocados.
- Suporte inicial a **`en`** e **`pt-BR`**, com **`pt-BR` como idioma default** quando não há cookie.
- Catálogos de mensagens em `messages/<locale>.json`, carregados server-side (sem custo no bundle do cliente).
- **Seletor de idioma** na tela de Aparência (`settings/appearance`), persistindo a escolha via cookie e re-renderizando as strings server-side.
- `RootLayout` passa a resolver o `lang` do `<html>` dinamicamente e envolve a árvore com `NextIntlClientProvider`.
- **Entrega em fases**: Fase 1 = infra + módulo piloto (login + settings/appearance) como padrão de referência; Fases seguintes = extração e tradução dos demais módulos (inbox, contacts, pipelines, broadcasts, automations, flows, dashboard, notifications, restante de settings), fora do escopo desta change.
- Adicionar um novo idioma passa a ser: um arquivo JSON + uma entrada de config. Sem mudanças de rota.

## Capabilities

### New Capabilities
- `internationalization`: seleção, persistência e resolução do idioma da interface; carregamento de catálogos de mensagens; e o contrato de como componentes (server e client) consomem strings traduzidas.

### Modified Capabilities
<!-- Nenhuma capability de spec existente muda (não há specs prévias). -->

## Impact

- **Dependências**: adiciona `next-intl`.
- **Config**: `next.config.ts` passa a ser envolvido por `createNextIntlPlugin`.
- **Novos arquivos**: `src/i18n/{config,request,locale}.ts`, `messages/en.json`, `messages/pt-BR.json`, componente de seletor de idioma.
- **Arquivos alterados**: `src/app/layout.tsx` (provider + `lang` dinâmico), `src/app/(auth)/login/page.tsx` e `src/components/settings/appearance-panel.tsx` (piloto).
- **Comportamento**: rotas que renderizam Server Components passam a ler o cookie de locale, tornando-as dinâmicas (a maior parte do dashboard já é dinâmica por causa da auth do Supabase).
- **Sem impacto** em: schema do banco, API pública `/api/v1`, webhooks, fluxo de WhatsApp.
