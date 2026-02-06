import VideoLayout from "@/components/VideoLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Clock } from "lucide-react";
import { Link } from "wouter";

export default function History() {
  const { data: history, isLoading } = trpc.history.list.useQuery({ limit: 50 });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Agora mesmo";
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <VideoLayout>
      <div className="h-full overflow-y-auto">
        <div className="container py-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Histórico de Reprodução</h1>
            <p className="text-muted-foreground">
              {history?.length || 0} vídeos assistidos
            </p>
          </div>

          {/* History List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-48 h-28 bg-muted rounded animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                        <div className="h-2 bg-muted rounded w-full animate-pulse" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item) => {
                const progress = (item.currentTime / item.duration) * 100;
                const video = item.video;

                if (!video) return null;

                return (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Link href={`/watch/${video.id}`} className="flex-shrink-0">
                          <div className="w-48 h-28 bg-muted rounded relative group cursor-pointer">
                            {video.thumbnailUrl ? (
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {!item.completed && (
                              <div className="absolute bottom-1 left-1 right-1">
                                <Progress value={progress} className="h-1" />
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="flex-1 min-w-0 space-y-2">
                          <Link href={`/watch/${video.id}`}>
                            <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary cursor-pointer">
                              {video.title}
                            </h3>
                          </Link>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{video.views} visualizações</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(item.lastWatchedAt)}
                            </span>
                          </div>

                          {item.completed ? (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-sm text-muted-foreground">Concluído</span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {formatTime(item.currentTime)} / {formatTime(item.duration)}
                                </span>
                                <span className="text-muted-foreground">
                                  {Math.round(progress)}%
                                </span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}

                          <Button asChild size="sm" variant="outline">
                            <Link href={`/watch/${video.id}`}>
                              {item.completed ? "Assistir novamente" : "Continuar assistindo"}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum histórico</h3>
              <p className="text-muted-foreground mb-4">
                Comece assistindo vídeos para ver seu histórico aqui
              </p>
              <Button asChild>
                <Link href="/library">Ir para Biblioteca</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </VideoLayout>
  );
}
