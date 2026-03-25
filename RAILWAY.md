# Deploy do Snapli Web no Railway

Este guia explica como fazer o deploy do frontend do Snapli no Railway.

## 📋 Pré-requisitos

1. Conta no Railway (https://railway.app)
2. Repositório GitHub conectado
3. URL da API (backend) já deployada

## 🚀 Passo a Passo

### 1. Criar Novo Projeto no Railway

1. Acesse https://railway.app
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Escolha o repositório `wagnerfsilva/snapliWeb`

### 2. Configurar Variáveis de Ambiente

No painel do Railway, vá em "Variables" e adicione:

```
VITE_API_URL=https://sua-url-backend.railway.app/api
```

⚠️ **Importante**: Certifique-se de usar a URL COMPLETA do backend, incluindo `/api`

### 3. Configurar Build

O Railway detectará automaticamente o Vite. As configurações em `railway.toml` já estão prontas:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run preview`

### 4. Verificar Deploy

Após o deploy:

1. Acesse a URL gerada pelo Railway
2. Verifique se a página inicial carrega corretamente
3. Teste a busca de fotos
4. Verifique se está conectando com o backend

### 5. Configurar Domínio Customizado (Opcional)

1. Vá em "Settings" no Railway
2. Em "Domains", clique em "Generate Domain" ou adicione um domínio customizado
3. Atualize a variável `FRONTEND_URL` no backend para permitir CORS

## 🔧 Alternativa: Deploy Estático

Para melhor performance e menor custo, considere hospedar o frontend em um serviço de hosting estático:

### Opção 1: Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd snapliWeb
vercel
```

Adicione a variável de ambiente no Vercel:
```
VITE_API_URL=https://sua-url-backend.railway.app/api
```

### Opção 2: Netlify

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
cd snapliWeb
netlify deploy --prod
```

Configurações no `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Opção 3: Railway com Servidor Estático

Modificar `railway.toml`:

```toml
[build]
builder = "nixpacks"
buildCommand = "npm install && npm install -g serve && npm run build"

[deploy]
startCommand = "serve -s dist -l $PORT"
```

## 🔧 Troubleshooting

### Erro 404 ao Navegar

Isso acontece porque é uma SPA (Single Page Application). Certifique-se de que o servidor está configurado para redirecionar todas as rotas para `index.html`.

Para o Railway usando Vite preview, isso já está configurado automaticamente.

### Erro de CORS

Se você ver erros de CORS no console:

1. Verifique se a URL do frontend está configurada no backend
2. No backend, adicione a URL do frontend à lista de origens permitidas

### Variáveis de Ambiente Não Funcionam

Lembre-se:
- Variáveis Vite precisam começar com `VITE_`
- É necessário rebuild após alterar variáveis
- Variáveis são embutidas no build (não são privadas)

### Build Falha

Verifique:
- Se todas as dependências estão no `package.json`
- Se não há erros de lint
- Os logs de build no Railway

## 📊 Monitoramento

Acesse as métricas no painel do Railway:
- Uso de CPU
- Uso de memória
- Largura de banda
- Logs em tempo real

## 💰 Custos

### Railway
- Plano gratuito: limitado
- Starter: $5/mês

### Alternativas Gratuitas
- **Vercel**: 100GB bandwidth/mês grátis
- **Netlify**: 100GB bandwidth/mês grátis
- **Cloudflare Pages**: Bandwidth ilimitado grátis

## 🔄 Atualizações

O deploy automático acontece quando você faz push para `main`:

```bash
git add .
git commit -m "Atualização do frontend"
git push origin main
```

## ⚙️ Configurações Recomendadas

### Headers de Segurança

Se usar Railway, adicione headers no Vite:

```js
// vite.config.js
export default {
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }
}
```

### Otimização de Build

O Vite já faz otimizações automaticamente:
- Minificação
- Tree-shaking
- Code splitting
- Lazy loading de rotas

## 🔗 Conectar com Backend

Certifique-se de que:

1. A variável `VITE_API_URL` aponta para o backend correto
2. O backend permite CORS da URL do frontend
3. Ambos os serviços estão usando HTTPS em produção

## 🔗 Links Úteis

- [Railway Docs](https://docs.railway.app)
- [Vite Docs](https://vitejs.dev)
- [Deploy Vite Apps](https://vitejs.dev/guide/static-deploy.html)
