# Fotow Web

Interface web do sistema Fotow - Plataforma para visualização e compra de fotos de eventos com reconhecimento facial.

## 🏗️ Tecnologias

- **Framework**: React 18
- **Build Tool**: Vite
- **Roteamento**: React Router v6
- **Estilização**: TailwindCSS
- **Gerenciamento de Estado**: Zustand
- **HTTP Client**: Axios

## 📋 Estrutura

```
fotowWeb/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   │   ├── forms/       # Formulários
│   │   └── layouts/     # Layouts (Admin, Public)
│   ├── pages/           # Páginas da aplicação
│   │   ├── admin/       # Páginas administrativas
│   │   ├── CheckoutPage.jsx
│   │   ├── DownloadPortalPage.jsx
│   │   ├── HomePage.jsx
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
git clone https://github.com/wagnerfsilva/fotowWeb.git
cd fotowWeb
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
- **Galeria de Resultados**: Visualização de fotos encontradas (com marca d'água)
- **Carrinho de Compras**: Seleção de fotos para compra
- **Checkout**: Finalização do pedido
- **Portal de Download**: Download de fotos originais após pagamento

### Área Administrativa

- **Dashboard**: Visão geral de eventos e estatísticas
- **Gerenciamento de Eventos**: CRUD completo de eventos
- **Upload de Fotos**: Upload em lote com preview
- **Detalhes do Evento**: Visualização e gerenciamento de fotos por evento

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
- **Repositório**: [fotowApi](https://github.com/wagnerfsilva/fotowApi)
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
