## 1. Infra do next-intl

- [x] 1.1 Instalar a dependência `next-intl`
- [x] 1.2 Criar `src/i18n/config.ts` com `locales` (`pt-BR`, `en`), `defaultLocale` (`pt-BR`), `LOCALE_COOKIE`, `LOCALE_LABELS` e `isLocale()`
- [x] 1.3 Criar `src/i18n/request.ts` (`getRequestConfig`) que lê o cookie de locale e carrega `messages/<locale>.json`
- [x] 1.4 Criar `src/i18n/locale.ts` com as server actions `getUserLocale` e `setUserLocale` (grava cookie + `revalidatePath`)
- [x] 1.5 Envolver `next.config.ts` com `createNextIntlPlugin("./src/i18n/request.ts")`

## 2. Catálogos de mensagens

- [x] 2.1 Criar `messages/en.json` com os namespaces do piloto (`auth.login`, `settings.appearance`)
- [x] 2.2 Criar `messages/pt-BR.json` espelhando as mesmas chaves em pt-BR

## 3. Integração no layout

- [x] 3.1 Tornar `RootLayout` async e resolver o `lang` do `<html>` via `getLocale()` do next-intl
- [x] 3.2 Envolver a árvore com `NextIntlClientProvider` (dentro do `ThemeProvider` existente), sem quebrar o boot script de tema

## 4. Seletor de idioma + módulo piloto

- [x] 4.1 Criar componente client `LanguageSwitcher` que lista `LOCALE_LABELS`, marca o ativo e chama `setUserLocale`
- [x] 4.2 Integrar o `LanguageSwitcher` no `settings/appearance-panel.tsx` (nova seção "Idioma")
- [x] 4.3 Traduzir `(auth)/login/page.tsx` usando `useTranslations('auth.login')`, sem strings hardcoded
- [x] 4.4 Traduzir os textos visíveis de `settings/appearance-panel.tsx` usando `useTranslations('settings.appearance')`

## 5. Validação

- [x] 5.1 Rodar `npm run typecheck` e corrigir erros de tipos
- [x] 5.2 Rodar `npm run build` para confirmar compatibilidade do plugin com Turbopack (Next 16)
- [x] 5.3 Subir `npm run dev` e verificar a troca de idioma end-to-end (login em pt-BR/en + seletor em Aparência)
