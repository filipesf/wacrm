## ADDED Requirements

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
