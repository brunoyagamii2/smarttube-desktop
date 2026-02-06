import { useEffect, useState, useMemo } from "react";
import { useRoute, Link } from "wouter";
import VideoLayout from "@/components/VideoLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ThumbsUp,
  Share2,
  ListPlus,
  CheckCircle2,
  Eye,
  Clock,
  Radio,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { VideoCardCompact, formatDuration, formatViews } from "./YouTubeSearch";
import type { YouTubeVideo } from "./YouTubeSearch";

export default function YouTubeWatch() {
  const [, params] = useRoute("/youtube/:videoId");
  const videoId = params?.videoId || "";

  // Fetch SponsorBlock segments
  const { data: settings } = trpc.settings.get.useQuery();

  const sponsorBlockCategories = useMemo(
    () => settings?.sponsorBlockCategories || undefined,
    [settings?.sponsorBlockCategories]
  );

  const { data: sponsorSegments } = trpc.sponsorBlock.getSegments.useQuery(
    { videoId, categories: sponsorBlockCategories as string[] | undefined },
    { enabled: !!videoId && settings?.sponsorBlockEnabled === true }
  );

  // Search for related videos
  const stableVideoId = useMemo(() => videoId, [videoId]);
  const { data: relatedData, isLoading: relatedLoading } = trpc.youtube.search.useQuery(
    { query: stableVideoId, language: "pt", country: "BR" },
    { enabled: !!stableVideoId }
  );

  if (!videoId) {
    return (
      <VideoLayout>
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">Vídeo não encontrado</p>
        </div>
      </VideoLayout>
    );
  }

  return (
    <VideoLayout>
      <div className="h-full overflow-y-auto">
        <div className="container py-6 max-w-[1600px]">
          <div className="flex gap-6">
            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* YouTube Player Embed */}
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                  title="YouTube Video Player"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* SponsorBlock Info */}
              {settings?.sponsorBlockEnabled && sponsorSegments && Array.isArray(sponsorSegments) && sponsorSegments.length > 0 && (
                <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                      SponsorBlock
                    </Badge>
                    <span className="text-sm text-amber-700 dark:text-amber-400">
                      {sponsorSegments.length} segmento(s) patrocinado(s) detectado(s) neste vídeo
                    </span>
                  </CardContent>
                </Card>
              )}

              {/* Video Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => toast.info("Funcionalidade em breve!")}>
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Curtir
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${videoId}`);
                  toast.success("Link copiado!");
                }}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast.info("Funcionalidade em breve!")}>
                  <ListPlus className="w-4 h-4 mr-2" />
                  Salvar na Playlist
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir no YouTube
                  </a>
                </Button>
              </div>
            </div>

            {/* Sidebar - Related Videos */}
            <div className="w-[400px] flex-shrink-0 hidden lg:block">
              <h3 className="font-semibold text-base mb-4">Vídeos Relacionados</h3>
              <div className="space-y-4">
                {relatedLoading && (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-2">
                      <Skeleton className="w-[168px] h-[94px] rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                )}
                {relatedData?.videos?.map((video) => (
                  video && (
                    <Link key={video.videoId} href={`/youtube/${video.videoId}`}>
                      <div className="flex gap-2 group cursor-pointer hover:bg-accent/50 rounded-lg p-1 -mx-1 transition-colors">
                        <div className="relative w-[168px] min-w-[168px] aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {video.isLive ? (
                            <Badge className="absolute bottom-1 right-1 bg-red-600 text-white text-[10px] px-1 py-0">
                              AO VIVO
                            </Badge>
                          ) : video.duration > 0 ? (
                            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded">
                              {formatDuration(video.duration)}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium line-clamp-2 leading-snug">
                            {video.title}
                          </h4>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-muted-foreground">{video.channelName}</span>
                            {video.channelVerified && (
                              <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatViews(video.views)} • {video.publishedTimeText}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </VideoLayout>
  );
}
