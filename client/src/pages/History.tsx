import { useMemo } from "react";
import VideoLayout from "@/components/VideoLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, History as HistoryIcon, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

function getSessionId(): string {
  let sessionId = localStorage.getItem("smarttube_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("smarttube_session_id", sessionId);
  }
  return sessionId;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTimeAgo(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Agora mesmo";
  if (minutes < 60) return `${minutes} min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days} dias atrás`;
  return date.toLocaleDateString("pt-BR");
}

export default function History() {
  const sessionId = useMemo(() => getSessionId(), []);

  const { data: history, isLoading } = trpc.youtubeHistory.list.useQuery({
    sessionId,
    limit: 100,
  });

  // Group history by date
  const groupedHistory = useMemo(() => {
    if (!history) return {};
    const groups: Record<string, any[]> = {};
    
    history.forEach((item: any) => {
      const date = new Date(item.lastWatchedAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = "Hoje";
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = "Ontem";
      } else {
        key = date.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  }, [history]);

  if (isLoading) {
    return (
      <VideoLayout>
        <div className="h-full overflow-y-auto">
          <div className="container py-8 space-y-6 max-w-[1200px]">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-48 h-28 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </VideoLayout>
    );
  }

  return (
    <VideoLayout>
      <div className="h-full overflow-y-auto">
        <div className="container py-8 space-y-6 max-w-[1200px]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <HistoryIcon className="w-7 h-7 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">Histórico</h1>
              </div>
              <p className="text-muted-foreground">
                {history?.length || 0} vídeos assistidos
              </p>
            </div>
          </div>

          {/* History List */}
          {history && history.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-8 pr-4">
                {Object.entries(groupedHistory).map(([dateGroup, items]) => (
                  <div key={dateGroup} className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground sticky top-0 bg-background py-2 z-10">
                      {dateGroup}
                    </h2>
                    <div className="space-y-2">
                      {items.map((item: any) => (
                        <Link key={item.id} href={`/youtube/${item.youtubeVideoId}`}>
                          <Card className="overflow-hidden hover:bg-accent/50 transition-colors cursor-pointer">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-4">
                                {/* Thumbnail */}
                                <div className="relative w-48 h-28 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                                  {item.thumbnailUrl ? (
                                    <img
                                      src={item.thumbnailUrl}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Play className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                  )}
                                  {item.duration > 0 && (
                                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                                      {formatDuration(item.duration)}
                                    </span>
                                  )}
                                  {/* Progress bar */}
                                  {item.duration > 0 && item.currentTime > 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                                      <div
                                        className="h-full bg-primary"
                                        style={{
                                          width: `${(item.currentTime / item.duration) * 100}%`,
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 space-y-1">
                                  <h3 className="font-medium text-sm line-clamp-2 text-foreground">
                                    {item.title}
                                  </h3>
                                  <span className="text-xs text-muted-foreground">
                                    {item.channelName || "Canal desconhecido"}
                                  </span>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatTimeAgo(item.lastWatchedAt)}</span>
                                    {item.completed && (
                                      <Badge variant="secondary" className="text-xs py-0">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Assistido
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-16 space-y-4">
              <HistoryIcon className="w-20 h-20 mx-auto text-muted-foreground/30" />
              <h3 className="text-xl font-semibold text-foreground">Nenhum vídeo assistido</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Seu histórico de reprodução aparecerá aqui. Comece assistindo vídeos para ver seu histórico.
              </p>
              <Link href="/search">
                <Button>
                  <Play className="w-4 h-4 mr-2" />
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
