import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import VideoLayout from "@/components/VideoLayout";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Play,
  Upload,
  Search,
  TrendingUp,
  Sparkles,
  History,
  Clock,
  Radio,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";

function formatDuration(seconds: number): string {
  if (!seconds) return "LIVE";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return `${views}`;
}

interface YouTubeVideo {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  channelAvatar: string;
  channelVerified: boolean;
  thumbnailUrl: string;
  duration: number;
  publishedTimeText: string;
  views: number;
  description: string;
  isLive: boolean;
}

function VideoGridCard({ video }: { video: YouTubeVideo }) {
  return (
    <Link href={`/youtube/${video.videoId}`}>
      <div className="group cursor-pointer w-[280px] flex-shrink-0">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-2">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
          {video.isLive ? (
            <Badge className="absolute bottom-2 right-2 bg-red-600 text-white text-xs">
              <Radio className="w-3 h-3 mr-1" />
              AO VIVO
            </Badge>
          ) : video.duration > 0 ? (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
              {formatDuration(video.duration)}
            </span>
          ) : null}
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-6 h-6 text-white" fill="white" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {video.channelAvatar && (
            <img
              src={video.channelAvatar}
              alt={video.channelName}
              className="w-8 h-8 rounded-full mt-0.5 flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-snug line-clamp-2 text-foreground">
              {video.title}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">{video.channelName}</span>
              {video.channelVerified && (
                <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatViews(video.views)} visualizações • {video.publishedTimeText}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SuggestionSection({ category, videos }: { category: string; videos: YouTubeVideo[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground capitalize">{category}</h3>
        <Link href={`/search?q=${encodeURIComponent(category)}`}>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Ver mais
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {videos.map((video) => (
            <VideoGridCard key={video.videoId} video={video} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function SuggestionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-48" />
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-[280px] flex-shrink-0">
            <Skeleton className="aspect-video rounded-xl mb-2" />
            <div className="flex gap-2">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContinueWatchingSection() {
  const { data: history, isLoading } = trpc.history.list.useQuery({ limit: 10 });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[280px] flex-shrink-0">
              <Skeleton className="aspect-video rounded-xl mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) return null;

  const incompleteItems = history.filter(h => !h.completed && h.video);

  if (incompleteItems.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Continuar Assistindo</h3>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {incompleteItems.slice(0, 8).map((item) => (
            <Link key={item.id} href={`/watch/${item.videoId}`}>
              <div className="group cursor-pointer w-[280px] flex-shrink-0">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-2">
                  {item.video?.thumbnailUrl ? (
                    <img
                      src={item.video.thumbnailUrl}
                      alt={item.video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${item.duration > 0 ? (item.currentTime / item.duration) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <h4 className="text-sm font-medium line-clamp-2">{item.video?.title}</h4>
              </div>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  // Fetch YouTube suggestions
  const { data: suggestions, isLoading: suggestionsLoading } = trpc.youtube.suggestions.useQuery(
    { language: "pt", country: "BR" },
    { enabled: isAuthenticated }
  );

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
                <h3 className="font-semibold text-sm mb-1">Busca YouTube</h3>
                <p className="text-xs text-muted-foreground">Busque e assista vídeos diretamente</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold text-sm mb-1">Sugestões IA</h3>
                <p className="text-xs text-muted-foreground">Recomendações baseadas no seu histórico</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold text-sm mb-1">SponsorBlock</h3>
                <p className="text-xs text-muted-foreground">Pule segmentos automaticamente</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold text-sm mb-1">Playlists</h3>
                <p className="text-xs text-muted-foreground">Organize seus vídeos facilmente</p>
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
        <div className="container py-6 space-y-8 max-w-[1400px]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">
                Olá, {user?.name?.split(" ")[0]}!
              </h1>
              <p className="text-muted-foreground">
                {suggestions?.basedOnHistory
                  ? "Sugestões personalizadas baseadas no seu histórico"
                  : "Descubra vídeos populares e tendências"}
              </p>
            </div>
            <Link href="/search">
              <Button variant="outline" size="lg">
                <Search className="w-5 h-5 mr-2" />
                Buscar no YouTube
              </Button>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/search">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <Search className="w-5 h-5" />
                <span className="text-xs">Buscar</span>
              </Button>
            </Link>
            <Link href="/library">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <Upload className="w-5 h-5" />
                <span className="text-xs">Biblioteca</span>
              </Button>
            </Link>
            <Link href="/playlists">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <Play className="w-5 h-5" />
                <span className="text-xs">Playlists</span>
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <History className="w-5 h-5" />
                <span className="text-xs">Histórico</span>
              </Button>
            </Link>
          </div>

          {/* Continue Watching */}
          <ContinueWatchingSection />

          {/* Suggestions Header */}
          {suggestions?.basedOnHistory && (
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Recomendado para Você</h2>
            </div>
          )}

          {!suggestions?.basedOnHistory && !suggestionsLoading && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Em Alta</h2>
            </div>
          )}

          {/* Suggestion Sections */}
          {suggestionsLoading && (
            <div className="space-y-8">
              <SuggestionSkeleton />
              <SuggestionSkeleton />
              <SuggestionSkeleton />
            </div>
          )}

          {suggestions?.sections.map((section, index) => (
            <SuggestionSection
              key={`${section.category}-${index}`}
              category={section.category}
              videos={section.videos as YouTubeVideo[]}
            />
          ))}

          {/* Empty state */}
          {!suggestionsLoading && (!suggestions?.sections || suggestions.sections.length === 0) && (
            <div className="text-center py-12 space-y-4">
              <Search className="w-16 h-16 mx-auto text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">Comece a explorar</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Use a busca para encontrar vídeos no YouTube. Suas recomendações aparecerão aqui conforme você assiste mais conteúdo.
              </p>
              <Link href="/search">
                <Button>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar Vídeos
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </VideoLayout>
  );
}
