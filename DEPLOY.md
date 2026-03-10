# Guia de Deploy - SmartTube Desktop

Este guia fornece instruções passo-a-passo para fazer deploy da aplicação SmartTube Desktop de forma **totalmente gratuita**.

## 🎯 Opções de Deploy

### 1️⃣ Vercel (Recomendado - Mais Fácil)

Vercel é a plataforma ideal para deploy de aplicações Next.js/React. O plano gratuito inclui:
- Hospedagem ilimitada
- Deploy automático via GitHub
- SSL/HTTPS
- Domínio customizado

#### Passos:

1. **Prepare o repositório GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/seu-usuario/smarttube-desktop.git
   git push -u origin main
   ```

2. **Acesse Vercel**
   - Vá para https://vercel.com
   - Clique em "Sign Up" e faça login com GitHub

3. **Crie um novo projeto**
   - Clique em "New Project"
   - Selecione o repositório `smarttube-desktop`
   - Vercel detectará automaticamente que é um projeto Node.js

4. **Configure as variáveis de ambiente** (opcional)
   - Em "Environment Variables", adicione:
     ```
     NODE_ENV=production
     PORT=3000
     ```

5. **Deploy**
   - Clique em "Deploy"
   - Aguarde a conclusão (geralmente 2-3 minutos)
   - Sua aplicação estará em: `https://seu-projeto.vercel.app`

#### Deploy automático:
Cada push para `main` fará deploy automaticamente!

---

### 2️⃣ Railway (Alternativa - Com Créditos Gratuitos)

Railway oferece $5 de créditos gratuitos por mês, suficiente para rodar a aplicação.

#### Passos:

1. **Instale Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Faça login**
   ```bash
   railway login
   ```

3. **Crie um novo projeto**
   ```bash
   railway init
   ```

4. **Configure variáveis de ambiente**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=3000
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Obtenha a URL**
   ```bash
   railway open
   ```

#### Monitoramento:
- Acesse https://railway.app para gerenciar seu projeto
- Veja logs em tempo real
- Configure alertas de créditos

---

### 3️⃣ Render (Alternativa - Hospedagem Gratuita)

Render oferece hospedagem gratuita com algumas limitações (pode hibernar após 15 min de inatividade).

#### Passos:

1. **Acesse Render**
   - Vá para https://render.com
   - Clique em "Sign Up" e faça login com GitHub

2. **Crie um Web Service**
   - Clique em "New +"
   - Selecione "Web Service"
   - Conecte seu repositório GitHub

3. **Configure**
   - **Name**: `smarttube-desktop`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Instance Type**: Free

4. **Variáveis de Ambiente**
   - Adicione:
     ```
     NODE_ENV=production
     PORT=3000
     ```

5. **Deploy**
   - Clique em "Create Web Service"
   - Aguarde o deploy (5-10 minutos)

---

### 4️⃣ GitHub Pages + Backend (Avançado)

Para uma solução mais complexa com backend separado:

1. **Frontend no GitHub Pages** (gratuito)
   ```bash
   pnpm build
   # Faça upload da pasta `dist/public` para GitHub Pages
   ```

2. **Backend no Railway/Render** (gratuito)
   - Deploy apenas a pasta `server/`
   - Configure como API

---

## 📊 Comparação de Plataformas

| Plataforma | Custo | Facilidade | Uptime | Recomendação |
|-----------|-------|-----------|--------|--------------|
| **Vercel** | Grátis | ⭐⭐⭐⭐⭐ | 99.95% | ✅ Melhor |
| **Railway** | $5/mês | ⭐⭐⭐⭐ | 99.9% | ✅ Bom |
| **Render** | Grátis | ⭐⭐⭐ | 99% | ⚠️ Hibernação |
| **GitHub Pages** | Grátis | ⭐⭐ | 99.9% | ⚠️ Apenas Frontend |

---

## 🔧 Troubleshooting

### Erro: "Cannot find package 'mysql2'"
**Solução**: O projeto usa SQLite por padrão. Se receber este erro:
```bash
pnpm remove mysql2
pnpm install
```

### Erro: "Port already in use"
**Solução**: Mude a porta em `.env`:
```env
PORT=3001
```

### Aplicação muito lenta no Render
**Solução**: Render hiberna após 15 min. Use Vercel ou Railway para melhor performance.

### Build falha no Vercel
**Solução**: Verifique se todas as dependências estão instaladas:
```bash
pnpm install
pnpm build
```

---

## 🚀 Próximos Passos

Após fazer deploy:

1. **Configure um domínio customizado**
   - Vercel: Vá para "Domains" nas configurações
   - Railway: Configure DNS records
   - Render: Adicione em "Custom Domains"

2. **Configure HTTPS**
   - Todas as plataformas oferecem SSL gratuito

3. **Monitore a aplicação**
   - Configure alertas de erro
   - Acompanhe métricas de performance

4. **Configure CI/CD**
   - Testes automáticos antes de deploy
   - Deploy automático após testes

---

## 💡 Dicas

- **Vercel é a melhor opção** para a maioria dos casos
- **Railway é ideal** se você precisa de banco de dados
- **Render é gratuito** mas pode hibernar
- **Sempre use variáveis de ambiente** para dados sensíveis
- **Configure backups** se usar banco de dados

---

## 📞 Suporte

Se tiver problemas com deploy:

1. Verifique os logs da plataforma
2. Abra uma [Issue](https://github.com/seu-usuario/smarttube-desktop/issues) no GitHub
3. Consulte a documentação oficial da plataforma

---

**Desenvolvido com ❤️ para ser totalmente gratuito e acessível**
