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
</content>
</invoke>
