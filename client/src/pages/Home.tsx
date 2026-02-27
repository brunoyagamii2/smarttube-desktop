import { Button } from "@/components/ui/button";
import VideoLayout from "@/components/VideoLayout";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Play,
  Search,
  TrendingUp,
  Sparkles,
  History,
  Clock,
  Radio,
  CheckCircle2,
  ChevronRight,
  Bell,
} from "lucide-react";
import { Link } from "wouter";
import { useMemo, useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

// Session ID for anonymous history tracking
function getSessionId(): string {
  let sessionId = localStorage.getItem("smarttube_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("smarttube_session_id", sessionId);
  }
  return sessionId;
}

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

// Seção de canais inscritos
function SubscribedChannelsSection() {
  const sessionId = useMemo(() => getSessionId(), []);
  const { data: subscriptions, isLoading } = trpc.youtubeSubscription.getSubscribed.useQuery({
    sessionId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-20 h-20 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!subscriptions || subscriptions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Seus Canais</h3>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {subscriptions.map((channel: any) => (
            <div key={channel.id} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {channel.channelThumbnail ? (
                  <img
                    src={channel.channelThumbnail}
                    alt={channel.channelName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Radio className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-center line-clamp-2 max-w-[80px]">{channel.channelName}</p>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function ContinueWatchingSection() {
  const sessionId = useMemo(() => getSessionId(), []);
  const { data: history, isLoading } = trpc.youtubeHistory.list.useQuery(
    { sessionId, limit: 10 }
  );

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

  const incompleteItems = history.filter((h: any) => !h.completed);

  if (incompleteItems.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Continuar Assistindo</h3>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {incompleteItems.slice(0, 8).map((item: any) => (
            <Link key={item.id} href={`/youtube/${item.youtubeVideoId}`}>
              <div className="group cursor-pointer w-[280px] flex-shrink-0">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-2">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
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
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-6 h-6 text-white" fill="white" />
                    </div>
                  </div>
                </div>
                <h4 className="text-sm font-medium line-clamp-2">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.channelName}</p>
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
  const { user, loading } = useAuth();
  const sessionId = useMemo(() => getSessionId(), []);

  // Fetch YouTube suggestions (works without auth)
  const { data: suggestions, isLoading: suggestionsLoading } = trpc.youtube.suggestions.useQuery(
    { sessionId, language: "pt", country: "BR" }
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

  return (
    <VideoLayout>
      <div className="h-full overflow-y-auto">
        <div className="container py-6 space-y-8 max-w-[1400px]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-foreground">
                {user ? `Olá, ${user.name?.split(" ")[0]}!` : "SmartTube Desktop"}
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Link href="/search">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <Search className="w-5 h-5" />
                <span className="text-xs">Buscar</span>
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <History className="w-5 h-5" />
                <span className="text-xs">Histórico</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs">Configurações</span>
              </Button>
            </Link>
          </div>

          {/* Subscribed Channels */}
          <SubscribedChannelsSection />

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

          {suggestions?.sections.map((section: any, index: number) => (
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
