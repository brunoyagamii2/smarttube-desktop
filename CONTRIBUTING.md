# Guia de Contribuição - SmartTube Desktop

Obrigado por considerar contribuir para o SmartTube Desktop! Este documento fornece diretrizes e instruções para contribuir.

## 📋 Código de Conduta

Todos os contribuidores devem seguir nosso código de conduta:
- Seja respeitoso com outros contribuidores
- Não faça discriminação de nenhum tipo
- Reporte comportamento inadequado aos mantenedores

## 🐛 Reportando Bugs

Antes de criar um relatório de bug, verifique se o problema já foi reportado.

**Ao reportar um bug, inclua:**
- Título claro e descritivo
- Descrição detalhada do comportamento observado
- Passos específicos para reproduzir o problema
- Comportamento esperado vs. comportamento real
- Screenshots (se aplicável)
- Seu ambiente (OS, navegador, versão do Node.js)

## 💡 Sugerindo Melhorias

**Ao sugerir uma melhoria:**
- Use um título claro e descritivo
- Forneça uma descrição detalhada da sugestão
- Liste exemplos de como a melhoria seria útil
- Mencione aplicações similares que implementam a funcionalidade

## 🔧 Processo de Contribuição

### 1. Fork o Repositório
```bash
git clone https://github.com/seu-usuario/smarttube-desktop.git
cd smarttube-desktop
```

### 2. Crie uma Branch
```bash
git checkout -b feature/sua-feature
# ou
git checkout -b fix/seu-bug-fix
```

**Nomes de branch:**
- `feature/nome-da-feature` - Para novas funcionalidades
- `fix/nome-do-bug` - Para correções de bugs
- `docs/nome-da-doc` - Para documentação
- `refactor/nome-do-refactor` - Para refatorações

### 3. Faça suas Mudanças

- Siga o estilo de código existente
- Adicione testes para novas funcionalidades
- Atualize a documentação conforme necessário

### 4. Commit suas Mudanças

```bash
git add .
git commit -m "feat: descrição clara da mudança"
```

**Formato de commit (Conventional Commits):**
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Mudanças na documentação
- `style:` - Formatação, sem mudanças de código
- `refactor:` - Refatoração de código
- `test:` - Adição ou atualização de testes
- `chore:` - Atualizações de dependências

### 5. Push para sua Branch
```bash
git push origin feature/sua-feature
```

### 6. Abra um Pull Request

- Descreva claramente as mudanças
- Referencie issues relacionadas (ex: `Closes #123`)
- Inclua screenshots se houver mudanças visuais
- Certifique-se de que os testes passam

## 📝 Guia de Estilo

### JavaScript/TypeScript
- Use `const` por padrão, `let` quando necessário
- Use arrow functions `() => {}`
- Adicione tipos TypeScript quando possível
- Use nomes descritivos para variáveis e funções

### React
- Use componentes funcionais com hooks
- Prefira composição a herança
- Use `useCallback` para otimizar performance
- Adicione PropTypes ou TypeScript

### CSS/Tailwind
- Use classes Tailwind quando possível
- Evite CSS customizado
- Use temas definidos em `index.css`
- Mantenha consistência com o design system

## 🧪 Testes

```bash
# Executar testes
pnpm test

# Executar com coverage
pnpm test -- --coverage

# Watch mode
pnpm test -- --watch
```

## 📚 Documentação

- Atualize o README.md se adicionar funcionalidades
- Documente funções complexas com comentários JSDoc
- Adicione exemplos de uso quando apropriado

## 🚀 Processo de Review

1. Pelo menos um mantenedor revisará seu PR
2. Mudanças podem ser solicitadas
3. Após aprovação, seu PR será mergeado
4. Seu nome será adicionado aos contribuidores

## ✅ Checklist antes de Submeter

- [ ] Código segue o guia de estilo
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Não há console.log ou código de debug
- [ ] TypeScript compila sem erros
- [ ] Testes passam localmente

## 📞 Dúvidas?

- Abra uma [Discussion](https://github.com/seu-usuario/smarttube-desktop/discussions)
- Envie um email para os mantenedores
- Participe do nosso Discord (se disponível)

## 🎉 Obrigado!

Suas contribuições tornam este projeto melhor para todos!

---

**Desenvolvido com ❤️ pela comunidade**
