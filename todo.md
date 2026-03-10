# SmartTube Desktop - TODO

## Funcionalidades Principais

### Interface e Layout
- [x] Interface desktop responsiva com navegação lateral
- [x] Design profissional focado em usabilidade

### Player de Vídeo
- [x] Player de vídeo integrado com controles básicos (play, pause, seek, volume, fullscreen)
- [x] Suporte a múltiplos formatos de vídeo e streaming
- [x] Controles de velocidade de reprodução ajustável (0.25x a 2x)
- [x] Suporte a qualidade de vídeo adaptativa (até 8K quando disponível)
- [x] Modo teatro e tela cheia para experiência imersiva

### Sistema de Playlists
- [x] Criação de playlists
- [x] Edição de playlists
- [x] Exclusão de playlists
- [x] Reordenação de vídeos nas playlists

### Biblioteca de Vídeos
- [x] Visualização em grid/lista
- [x] Busca por título
- [x] Upload e gerenciamento de vídeos

### Histórico e Retomada
- [x] Histórico de reprodução
- [x] Retomada automática do último ponto assistido

### Atalhos e Controles
- [x] Atalhos de teclado para controle rápido do player

### Integrações de IA
- [x] Integração com API do SponsorBlock para pular segmentos patrocinados
- [x] Transcrição automática de áudio para legendas com Whisper
- [x] Geração automática de miniaturas personalizadas com IA

## Banco de Dados
- [x] Schema de vídeos
- [x] Schema de playlists
- [x] Schema de histórico de reprodução
- [x] Schema de configurações do usuário

## Backend (tRPC)
- [x] Procedures para gerenciamento de vídeos
- [x] Procedures para gerenciamento de playlists
- [x] Procedures para histórico de reprodução
- [x] Procedures para integração com SponsorBlock
- [x] Procedures para transcrição com Whisper
- [x] Procedures para geração de miniaturas

## Testes
- [x] Testes unitários para procedures críticas
- [x] Testes de integração do player

## Bugs
- [x] Tabelas do banco de dados não foram criadas (videos, playlists, playlistItems, watchHistory, userSettings, videoTranscriptions)

## Novas Funcionalidades
- [x] Busca de vídeos do YouTube integrada (como no SmartTube Android)
- [x] Sistema de sugestões de vídeos baseado no histórico do usuário (IA com LLM)
- [x] Feed de vídeos recomendados na página inicial
- [x] Reprodução direta de vídeos do YouTube via embed
- [x] Vídeos relacionados na sidebar durante reprodução
- [x] Tema escuro com cores vermelhas (estilo SmartTube)
- [x] Testes para procedures YouTube e SponsorBlock
- [x] Autocompletar na barra de busca do YouTube com sugestões em tempo real

## Correções e Alterações Solicitadas
- [x] Corrigir histórico de reprodução (agora usa youtubeHistory com sessionId anônimo)
- [x] Permitir acesso sem credenciais (todas as procedures principais são públicas)
- [x] Remover a biblioteca da plataforma (página e navegação removidas)
- [x] Tabela youtubeHistory criada para rastrear vídeos do YouTube sem autenticação
- [x] Login agora é opcional (botão "Entrar (opcional)" na sidebar)


## Novas Funcionalidades (Sessão 2)
- [x] Salvar vídeos do YouTube em playlists
- [x] Inscrições em canais do YouTube
- [x] Feed de novos vídeos de canais inscritos na página inicial
- [ ] Autoplay contínuo (reprodução automática em sequência) - Estrutura pronta no backend, aguardando integração no player

## Migração para Stack 100% Gratuita e Open-Source
- [ ] Auditar todas as dependências Manus (OAuth, LLM, DataAPI, Storage, Notifications)
- [ ] Remover Manus OAuth - substituir por autenticação local (email/senha com bcrypt + JWT)
- [ ] Remover Manus LLM API - substituir sugestões por algoritmo local baseado em histórico
- [ ] Remover Manus DataAPI - usar YouTube Data API v3 gratuita ou scraping via Invidious
- [ ] Remover Manus Storage (S3) - usar armazenamento local ou Supabase Storage gratuito
- [ ] Remover Manus Notifications - usar notificações do navegador (Web Push API)
- [ ] Migrar banco de dados MySQL/TiDB para PostgreSQL (Supabase gratuito)
- [ ] Configurar deploy no Vercel (frontend + API serverless)
- [ ] Criar README completo com instruções de deploy
- [ ] Adicionar licença open-source (MIT)
- [ ] Configurar GitHub Actions para CI/CD
- [ ] Garantir que todo o projeto funcione sem custos
