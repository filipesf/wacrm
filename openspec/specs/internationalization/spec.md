# internationalization Specification

## Purpose

Seleção, persistência e resolução do idioma da interface; carregamento de catálogos de mensagens; e o contrato de como componentes (server e client) consomem strings traduzidas.

## Requirements

### Requirement: Idiomas suportados e default

O sistema SHALL suportar os locales `en` e `pt-BR`, e SHALL usar `pt-BR` como idioma default quando o visitante não tiver uma preferência de idioma persistida. A lista de locales suportados e o default SHALL ser definidos numa configuração central única.

#### Scenario: Visitante sem preferência

- **WHEN** um visitante acessa a aplicação sem o cookie de locale
- **THEN** a interface é renderizada em `pt-BR`

#### Scenario: Locale inválido no cookie

- **WHEN** o cookie de locale contém um valor que não está na lista de locales suportados
- **THEN** o sistema usa o idioma default (`pt-BR`) em vez de falhar

### Requirement: Persistência da preferência de idioma

O sistema SHALL persistir a escolha de idioma do usuário num cookie e SHALL resolvê-la a cada requisição que renderiza Server Components, sem depender de um segmento de rota localizado.

#### Scenario: Escolha persiste entre sessões

- **WHEN** o usuário seleciona `en` e recarrega a página numa nova sessão do navegador
- **THEN** a interface continua em `en` porque o cookie de locale foi lido

#### Scenario: URL não contém o locale

- **WHEN** o usuário navega pela aplicação em qualquer idioma
- **THEN** as URLs permanecem sem prefixo de locale (não há `/pt-BR/...` nem `/en/...`)

### Requirement: Troca de idioma pela interface

O sistema SHALL oferecer um seletor de idioma na tela de Aparência (`settings/appearance`) que permite alternar entre os idiomas suportados, e a troca SHALL refletir imediatamente nas strings renderizadas server-side.

#### Scenario: Usuário troca o idioma

- **WHEN** o usuário abre Configurações → Aparência e seleciona um idioma diferente
- **THEN** o cookie de locale é atualizado e a interface é re-renderizada no novo idioma sem recarregar manualmente

#### Scenario: Idioma atual destacado

- **WHEN** o seletor de idioma é exibido
- **THEN** o idioma atualmente ativo aparece marcado como selecionado

### Requirement: Catálogos de mensagens carregados server-side

O sistema SHALL manter um catálogo de mensagens por locale em `messages/<locale>.json`, organizados por namespace hierárquico, e SHALL carregá-los no servidor de forma que não aumentem o bundle JavaScript do cliente com traduções não usadas.

#### Scenario: Mensagens disponíveis a componentes

- **WHEN** um Server Component ou Client Component solicita uma chave de tradução de um namespace existente
- **THEN** o texto correspondente ao locale ativo é retornado

#### Scenario: Adicionar um novo idioma

- **WHEN** um mantenedor adiciona `messages/<novo-locale>.json` e registra o locale na configuração central
- **THEN** o novo idioma passa a ser selecionável sem nenhuma mudança de rota

### Requirement: `<html lang>` reflete o locale ativo

O `RootLayout` SHALL definir o atributo `lang` do elemento `<html>` de acordo com o locale ativo e SHALL disponibilizar as mensagens aos Client Components via provider.

#### Scenario: Atributo lang correto

- **WHEN** a interface é renderizada em `pt-BR`
- **THEN** o elemento `<html>` tem `lang="pt-BR"`

### Requirement: Módulo piloto totalmente traduzido

O sistema SHALL entregar o módulo piloto — tela de login (`(auth)/login`) e painel de Aparência (`settings/appearance`) — com todo o texto de interface externalizado para os catálogos e disponível em `en` e `pt-BR`, servindo de padrão de referência para os demais módulos.

#### Scenario: Login traduzido

- **WHEN** um visitante abre a tela de login em `pt-BR`
- **THEN** todos os textos visíveis (títulos, rótulos, placeholders, botões, links) aparecem em pt-BR, sem strings hardcoded em inglês

#### Scenario: Painel de Aparência traduzido

- **WHEN** o usuário abre Configurações → Aparência em `pt-BR`
- **THEN** todos os textos visíveis do painel aparecem em pt-BR

### Requirement: Cobertura total de UI

Todo o texto de interface visível dos módulos da aplicação — inbox, contacts, dashboard, pipelines, broadcasts, automations, flows, notifications, settings, navegação/layout e componentes de UI com cópia embutida — SHALL ser externalizado para os catálogos de mensagens e disponível em `en` e `pt-BR`, sem strings hardcoded no código dos componentes.

#### Scenario: Módulo renderizado em pt-BR

- **WHEN** o usuário abre qualquer módulo da aplicação com o locale `pt-BR`
- **THEN** todos os textos visíveis (títulos, rótulos, botões, placeholders, aria-labels, estados vazios, mensagens de confirmação) aparecem em pt-BR

#### Scenario: Sem strings hardcoded

- **WHEN** o código de um componente de UI traduzido é inspecionado
- **THEN** não há texto de interface literal em inglês — todo texto vem de `useTranslations`/`getTranslations`

### Requirement: Notificações (toasts) traduzidas

As mensagens de toast SHALL ser traduzidas. Mensagens com valores dinâmicos SHALL usar interpolação/pluralização ICU em vez de concatenação. Para toasts que exibem um erro repassado pelo servidor com um fallback do cliente, o fallback SHALL ser traduzido.

#### Scenario: Toast literal

- **WHEN** uma ação dispara um toast de sucesso ou erro com texto fixo
- **THEN** o texto exibido está no locale ativo

#### Scenario: Toast com variável ou plural

- **WHEN** um toast inclui um valor dinâmico (ex.: nome, contagem)
- **THEN** a mensagem é montada por uma chave ICU que aplica a forma plural correta do locale, não por concatenação de strings

#### Scenario: Toast de erro repassado

- **WHEN** um toast mostra `erroDoServidor || fallback` e o servidor não forneceu mensagem
- **THEN** o fallback exibido está traduzido no locale ativo

### Requirement: Formatação locale-aware de data, número e moeda

Datas, números e valores monetários exibidos na interface SHALL ser formatados de acordo com o locale ativo, e valores monetários SHALL usar o `account.default_currency` quando disponível.

#### Scenario: Data no formato do locale

- **WHEN** uma data é exibida com o locale `pt-BR`
- **THEN** ela aparece no formato brasileiro (DD/MM/AAAA), não no formato en-US

#### Scenario: Moeda com a moeda da conta

- **WHEN** um valor monetário é exibido e a conta define `default_currency`
- **THEN** o valor é formatado no locale ativo usando essa moeda

#### Scenario: Moeda sem configuração

- **WHEN** um valor monetário é exibido e a conta não define `default_currency`
- **THEN** um código de moeda padrão é usado como fallback, sem erro

### Requirement: Catálogos organizados por módulo

Os catálogos de mensagens SHALL ser organizados como um arquivo por módulo dentro de um diretório por locale (`messages/<locale>/<módulo>.json`), mesclados na resolução de request, de forma que módulos diferentes possam ser traduzidos sem conflito de edição no mesmo arquivo.

#### Scenario: Adicionar traduções de um módulo

- **WHEN** um módulo é traduzido editando apenas seu arquivo de catálogo
- **THEN** as mensagens ficam disponíveis sem tocar nos catálogos de outros módulos

### Requirement: Fronteiras de não-tradução

As mensagens de erro do contrato da API pública (`/api/v1`), os erros crus originados de serviços externos (Supabase, Meta/WhatsApp) e os dados do usuário (contatos, mensagens) SHALL permanecer sem tradução.

#### Scenario: Erro da API pública

- **WHEN** um cliente externo recebe uma resposta de erro de `/api/v1`
- **THEN** a mensagem permanece em inglês (estável como contrato), independentemente do locale do usuário

#### Scenario: Dado do usuário

- **WHEN** um nome de contato ou o conteúdo de uma mensagem é exibido
- **THEN** o texto é mostrado como o usuário o inseriu, sem tentativa de tradução

### Requirement: Garantia de paridade de chaves

O projeto SHALL verificar na integração contínua que os conjuntos de chaves de todos os catálogos de locale são idênticos, e a verificação SHALL falhar quando qualquer chave existir em um locale e faltar em outro.

#### Scenario: Chave faltando bloqueia o merge

- **WHEN** uma chave é adicionada ao catálogo `en` mas não ao `pt-BR` (ou vice-versa)
- **THEN** o check de CI de paridade falha, sinalizando a chave divergente antes do merge
</content>
</invoke>
