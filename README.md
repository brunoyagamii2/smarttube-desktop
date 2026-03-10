# SmartTube Desktop 🎬

Uma plataforma desktop moderna para reprodução de vídeos do YouTube com funcionalidades avançadas, totalmente gratuita e open-source.

## ✨ Funcionalidades

- 🔍 **Busca integrada do YouTube** - Encontre vídeos diretamente na aplicação
- 📺 **Player avançado** - Controles profissionais, velocidade ajustável (0.25x - 2x), qualidade adaptativa
- 📋 **Sistema de Playlists** - Crie, edite e organize suas playlists do YouTube
- 📜 **Histórico de reprodução** - Retomada automática do último ponto assistido
- 🎯 **SponsorBlock integrado** - Pule automaticamente intros, outros e segmentos patrocinados
- 🤖 **Sugestões com IA** - Recomendações baseadas no seu histórico de visualização
- 🔔 **Inscrições em canais** - Acompanhe seus canais favoritos
- ⚙️ **Configurações personalizáveis** - Tema, qualidade, autoplay e muito mais
- ⌨️ **Atalhos de teclado** - Controle rápido do player
- 🎨 **Interface escura** - Design moderno e intuitivo

## 🚀 Instalação Local

### Pré-requisitos
- Node.js 18+ e pnpm
- Git

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/smarttube-desktop.git
cd smarttube-desktop

# 2. Instale as dependências
pnpm install

# 3. Inicie o servidor de desenvolvimento
pnpm dev

# 4. Abra no navegador
# Acesse http://localhost:3000
```

## 🌐 Deploy Gratuito

### Opção 1: Vercel (Recomendado)

Vercel oferece hospedagem gratuita com deploy automático via GitHub.

```bash
# 1. Faça push do código para GitHub
git push origin main

# 2. Acesse https://vercel.com
# 3. Clique em "New Project"
# 4. Selecione o repositório do SmartTube
# 5. Configure as variáveis de ambiente (se necessário)
# 6. Clique em "Deploy"
```

**Vantagens:**
- Hospedagem gratuita ilimitada
- Deploy automático a cada push
- SSL/HTTPS incluído
- Domínio customizado gratuito

### Opção 2: Railway

Railway oferece créditos gratuitos mensais ($5/mês).

```bash
# 1. Instale o Railway CLI
npm i -g @railway/cli

# 2. Faça login
railway login

# 3. Crie um novo projeto
railway init

# 4. Deploy
railway up
```

**Vantagens:**
- Créditos gratuitos mensais
- Suporte a banco de dados
- Interface simples

### Opção 3: Render

Render oferece hospedagem gratuita com limitações.

```bash
# 1. Acesse https://render.com
# 2. Clique em "New +"
# 3. Selecione "Web Service"
# 4. Conecte seu repositório GitHub
# 5. Configure e deploy
```

## 🗄️ Banco de Dados

O SmartTube Desktop usa **SQLite** por padrão (totalmente gratuito e local).

### Configuração

```bash
# O banco de dados é criado automaticamente em:
# ./smarttube.db

# Para usar um banco remoto (opcional):
# Defina a variável de ambiente DATABASE_URL
export DATABASE_URL="file:./smarttube.db"
```

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Banco de dados (opcional, SQLite é padrão)
DATABASE_URL=file:./smarttube.db

# Servidor
NODE_ENV=development
PORT=3000

# Frontend
VITE_APP_TITLE=SmartTube Desktop
```

## 📦 Build para Produção

```bash
# Build do frontend
pnpm build

# Inicie o servidor de produção
pnpm start
```

## 🛠️ Desenvolvimento

### Estrutura do Projeto

```
smarttube-desktop/
├── client/              # Frontend React
│   ├── src/
│   │   ├── pages/      # Páginas da aplicação
│   │   ├── components/ # Componentes reutilizáveis
│   │   ├── App.tsx     # Componente principal
│   │   └── main.tsx    # Ponto de entrada
│   └── public/         # Arquivos estáticos
├── server/              # Backend Express + tRPC
│   ├── routers.ts      # Procedures tRPC
│   ├── db.ts           # Helpers do banco
│   └── _core/          # Configuração interna
├── drizzle/            # Schema do banco de dados
├── shared/             # Código compartilhado
└── package.json        # Dependências
```

### Comandos Úteis

```bash
# Desenvolvimento
pnpm dev          # Inicia servidor de dev

# Build
pnpm build        # Build para produção
pnpm start        # Inicia servidor de produção

# Testes
pnpm test         # Executa testes unitários

# Linting
pnpm check        # Verifica TypeScript
pnpm format       # Formata código
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- Inspirado no [SmartTube Android](https://github.com/yuliskov/SmartTube)
- Construído com [React](https://react.dev), [Express](https://expressjs.com), [tRPC](https://trpc.io)
- Hospedado gratuitamente no [Vercel](https://vercel.com)

## 📞 Suporte

Para reportar bugs ou sugerir features, abra uma [Issue](https://github.com/seu-usuario/smarttube-desktop/issues) no GitHub.

---

**Desenvolvido com ❤️ para a comunidade**
