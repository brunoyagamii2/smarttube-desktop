import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import VideoLayout from "@/components/VideoLayout";
import { Play, Upload } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-md w-full mx-4 text-center space-y-8">
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary flex items-center justify-center">
              <Play className="w-12 h-12 text-primary-foreground" fill="currentColor" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">SmartTube Desktop</h1>
            <p className="text-lg text-muted-foreground">
              Plataforma profissional de reprodução de vídeos com recursos avançados de IA
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold text-sm mb-1">Player Avançado</h3>
                <p className="text-xs text-muted-foreground">Controles profissionais com suporte até 8K</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold text-sm mb-1">Playlists</h3>
                <p className="text-xs text-muted-foreground">Organize seus vídeos facilmente</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold text-sm mb-1">SponsorBlock</h3>
                <p className="text-xs text-muted-foreground">Pule segmentos automaticamente</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold text-sm mb-1">Transcrição IA</h3>
                <p className="text-xs text-muted-foreground">Legendas automáticas com Whisper</p>
              </div>
            </div>
          </div>

          <Button asChild size="lg" className="w-full">
            <a href={getLoginUrl()}>Entrar para Começar</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <VideoLayout>
      <div className="h-full overflow-y-auto">
        <div className="container py-8 space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Bem-vindo, {user?.name}!
            </h1>
            <p className="text-muted-foreground">
              Comece fazendo upload de vídeos ou explore sua biblioteca
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/library">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <Play className="w-8 h-8" />
                <span>Biblioteca de Vídeos</span>
              </Button>
            </Link>

            <Link href="/library?upload=true">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <Upload className="w-8 h-8" />
                <span>Fazer Upload</span>
              </Button>
            </Link>

            <Link href="/playlists">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <Play className="w-8 h-8" />
                <span>Minhas Playlists</span>
              </Button>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Atividade Recente</h2>
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                Nenhuma atividade recente. Comece fazendo upload de vídeos!
              </p>
            </div>
          </div>
        </div>
      </div>
    </VideoLayout>
  );
}
