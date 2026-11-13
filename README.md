# Snapli Web

Interface web do sistema Snapli - Plataforma para visualização e compra de fotos de eventos com reconhecimento facial.

## 🏗️ Tecnologias

- **Framework**: React 18
- **Build Tool**: Vite
- **Roteamento**: React Router v6
- **Estilização**: TailwindCSS
- **Gerenciamento de Estado**: Zustand
- **HTTP Client**: Axios

## 📋 Estrutura

```
snapliWeb/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   │   ├── forms/       # Formulários
│   │   └── layouts/     # Layouts (Admin, Public)
│   ├── pages/           # Páginas da aplicação
│   │   ├── admin/       # Páginas administrativas
│   │   ├── CheckoutPage.jsx
│   │   ├── DownloadPortalPage.jsx
│   │   ├── ResultsPage.jsx
│   │   └── SearchPage.jsx
│   ├── store/           # Stores Zustand
│   ├── lib/             # Bibliotecas e utilitários
│   └── App.jsx          # Componente principal
├── public/              # Arquivos públicos
└── index.html           # HTML principal
```

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/wagnerfsilva/snapliWeb.git
cd snapliWeb
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com a URL da API:

```
VITE_API_URL=http://localhost:3000/api
```

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

## 🎨 Funcionalidades

### Área Pública

- **Página Inicial**: Apresentação do sistema
- **Busca por Foto**: Upload de foto ou captura via câmera para encontrar imagens
- **Galeria de Resultados**: Visualização de fotos encontradas (com marca d'água). As prévias são exibidas inteiras, sem recorte, em cards de tamanho uniforme; fotos com proporção diferente do card podem ter faixas de fundo
- **Carrinho de Compras**: Seleção de fotos para compra
- **Checkout**: Finalização do pedido
- **Portal de Download**: Download de fotos originais após pagamento

### Área Administrativa

- **Dashboard**: Visão geral de eventos e estatísticas
- **Gerenciamento de Eventos**: CRUD completo de eventos
- **Agenda** (`/admin/agenda`): calendário mensal por padrão, com visões semanal e anual, navegação de períodos e botão Hoje. Exibe eventos de fotos conforme as permissões atuais e permite que administradores, fotógrafos e organizadores criem compromissos pessoais com data, título e descrição. Clique em um dia para selecioná-lo, no `+` para criar ou em um evento para consultar os detalhes. Compromissos são privados e não criam eventos de venda de fotos
- **Navegação e Agenda no celular**: abaixo de 1024 px, o menu administrativo abre pelo botão no cabeçalho e pode ser fechado pelo `X`, tocando fora ou pressionando Escape. A visão mensal usa uma grade compacta com os compromissos do dia selecionado logo abaixo; a semanal lista os sete dias verticalmente. A visão anual mostra um mês por linha no celular e ganha colunas em telas maiores. Os formulários se ajustam à tela sem rolagem horizontal; em desktop, a barra lateral e as grades de mês/semana são mantidas
- **Upload de Fotos**: Upload em lote com preview
- **Detalhes do Evento**: Visualização e gerenciamento de fotos por evento
- **Cortesias** (`/admin/courtesies`, somente admin): envie uma foto de referência,
  revise fotos e vídeos encontrados em eventos ativos usando a mesma galeria
  pública: eventos em abas do mais recente ao mais antigo, filtros de fotos/vídeos,
  cards com correspondência facial e ampliação de prévias. A primeira aba é a do
  evento mais recente. Selecione individualmente ou todos os arquivos da aba/filtro,
  até 1000 por pedido, mantendo a seleção ao trocar de evento. O contador mostra
  selecionados sobre o total encontrado na busca, não sobre o limite de 1000.
  Informe o nome do destinatário e, se desejar,
  e-mail. **Criar pedido cortesia** libera os originais sem PIX e sem envio de
  e-mail. Copie e compartilhe manualmente o link, válido por 90 dias, acessível
  por qualquer pessoa que o receber, sem login. A seleção fora do filtro continua
  visível no contador; uma nova busca limpa a seleção. A seção **Cortesias criadas**
  lista todos os pedidos em linhas compactas, com nome, quantidade, criação,
  validade e ações para copiar o link, abrir o portal ou **Remover**. A lista tem
  paginação de 20 registros e é atualizada após criar ou remover uma cortesia.
  Remover pede confirmação e exclui permanentemente a cortesia e seus itens,
  desativando o link sem apagar fotos ou vídeos originais. Downloads já feitos
  e URLs S3 já assinadas não são recolhidos (estas expiram em até 1 hora).
  O link também pode ser
  recuperado nos pedidos de cada evento pelo filtro **Cortesia**. Cortesias não
  compõem vendas, receita, comissões ou saldo de resgates.

As cortesias requerem a API atualizada e a migração
`20261113000003-add-courtesy-orders` aplicada antes de publicar o frontend.

A agenda requer a API atualizada e a migração `20261113000002-create-agenda-entries`.
As datas da agenda representam dias inteiros, sem conversão de fuso horário.
Na legenda, nos compromissos e nas bolinhas dos calendários mensal e anual,
verde-lima identifica eventos de fotos e turquesa identifica compromissos pessoais.
Dias com os dois tipos mostram as duas bolinhas, sem repetir marcadores do mesmo tipo.
Nos detalhes de um compromisso pessoal, use **Remover compromisso** e confirme
a exclusão. Apenas o criador pode removê-lo, mesmo para usuários administradores;
eventos de fotos não exibem esse botão.

## 🧪 Scripts Disponíveis

```bash
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Gera build de produção
npm run preview          # Preview do build de produção
npm run lint             # Executa linter
```

## 📦 Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`

## 🌐 Deploy

Este projeto está configurado para deploy no Railway.

### Configuração Railway

1. Conecte o repositório GitHub
2. Configure a variável de ambiente `VITE_API_URL`
3. Build Command: `npm run build`
4. Start Command: `npm run preview` ou use um servidor estático

### Opção com Servidor Estático

Para servir os arquivos estáticos, você pode usar `serve`:

```bash
npm install -g serve
serve -s dist -l 5173
```

## 🎨 Personalização

### Tailwind CSS

A configuração do Tailwind está em `tailwind.config.js`. Você pode personalizar:
- Cores
- Fontes
- Espaçamentos
- Breakpoints

### Tema

O tema da aplicação pode ser ajustado no arquivo `src/index.css`

## 🔗 API

O frontend consome a API disponível em:
- **Repositório**: [snapliApi](https://github.com/wagnerfsilva/snapliApi)
- **URL Base**: Configurada via `VITE_API_URL`

## 📱 Responsividade

O layout é totalmente responsivo e otimizado para:
- 📱 Mobile (smartphones)
- 📱 Tablet
- 💻 Desktop

## 🔐 Autenticação

A autenticação é gerenciada via JWT tokens armazenados no `localStorage` e gerenciados pelo store `authStore`.

## 📝 Licença

Propriedade privada - Todos os direitos reservados
