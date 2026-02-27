import { useEffect, useState, useMemo, useRef } from "react";
import { useRoute, Link } from "wouter";
import VideoLayout from "@/components/VideoLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ThumbsUp,
  Share2,
  ListPlus,
  CheckCircle2,
  ExternalLink,
  Bell,
  BellOff,
} from "lucide-react";
import { toast } from "sonner";
import { formatDuration, formatViews } from "./YouTubeSearch";

function getSessionId(): string {
  let sessionId = localStorage.getItem("smarttube_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("smarttube_session_id", sessionId);
  }
  return sessionId;
}

// Component para salvar vídeo em playlist
function SaveToPlaylistDialog({
  videoId,
  videoTitle,
  channelName,
  channelId,
  thumbnailUrl,
  videoDuration,
}: {
  videoId: string;
  videoTitle: string;
  channelName?: string;
  channelId?: string;
  thumbnailUrl?: string;
  videoDuration: number;
}) {
  const { data: playlists } = trpc.playlists.list.useQuery();
  const addVideoMutation = trpc.youtubePlaylist.addVideo.useMutation({
    onSuccess: () => {
      toast.success("Vídeo adicionado à playlist!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar vídeo: " + error.message);
    },
  });

  return (
    <div className="space-y-3">
      {playlists && playlists.length > 0 ? (
        playlists.map((playlist: any) => (
          <Button
            key={playlist.id}
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              addVideoMutation.mutate({
                playlistId: playlist.id as number,
                youtubeVideoId: videoId,
                title: videoTitle,
                channelName,
                channelId,
                thumbnailUrl,
                duration: videoDuration,
              });
            }}
            disabled={addVideoMutation.isPending}
          >
            {playlist.name}
          </Button>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhuma playlist criada. Crie uma na página de Playlists.
        </p>
      )}
    </div>
  );
}

// Component para inscrição em canais
function SubscribeButton({
  sessionId,
  channelId,
  channelName,
}: {
  sessionId: string;
  channelId: string;
  channelName?: string;
}) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const isSubscribedQuery = trpc.youtubeSubscription.isSubscribed.useQuery(
    { sessionId, channelId },
    { enabled: !!channelId }
  );
  const subscribeMutation = trpc.youtubeSubscription.subscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(true);
      toast.success("Inscrito no canal!");
    },
  });
  const unsubscribeMutation = trpc.youtubeSubscription.unsubscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(false);
      toast.success("Desincrição realizada!");
    },
  });

  useEffect(() => {
    if (isSubscribedQuery.data !== undefined) {
      setIsSubscribed(isSubscribedQuery.data);
    }
  }, [isSubscribedQuery.data]);

  if (!channelId) return null;

  const handleToggle = () => {
    if (isSubscribed) {
      unsubscribeMutation.mutate({ sessionId, channelId });
    } else {
      subscribeMutation.mutate({
        sessionId,
        channelId,
        channelName: channelName || "Canal",
      });
    }
  };

  return (
    <Button
      variant={isSubscribed ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={subscribeMutation.isPending || unsubscribeMutation.isPending}
    >
      {isSubscribed ? (
        <>
          <Bell className="w-4 h-4 mr-2" />
          Inscrito
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4 mr-2" />
          Inscrever
        </>
      )}
    </Button>
  );
}

export default function YouTubeWatch() {
  const [, params] = useRoute("/youtube/:videoId");
  const videoId = params?.videoId || "";
  const sessionId = useMemo(() => getSessionId(), []);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [channelName, setChannelName] = useState("");
  const [channelId, setChannelId] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const historySaved = useRef(false);

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

  // Get existing history for this video
  const { data: existingHistory } = trpc.youtubeHistory.getForVideo.useQuery(
    { sessionId, youtubeVideoId: videoId },
    { enabled: !!videoId }
  );

  // Save history mutation
  const saveHistoryMutation = trpc.youtubeHistory.save.useMutation();

  // Search for related videos based on videoId
  const stableVideoId = useMemo(() => videoId, [videoId]);
  const { data: relatedData, isLoading: relatedLoading } = trpc.youtube.search.useQuery(
    { query: stableVideoId, language: "pt", country: "BR" },
    { enabled: !!stableVideoId }
  );

  // Extract video info from related data or use defaults
  useEffect(() => {
    if (relatedData?.videos && relatedData.videos.length > 0) {
      const currentVideo = relatedData.videos.find((v: any) => v?.videoId === videoId);
      if (currentVideo) {
        setVideoTitle(currentVideo.title);
        setChannelName(currentVideo.channelName);
        setChannelId(currentVideo.channelId);
        setThumbnailUrl(currentVideo.thumbnailUrl);
        setVideoDuration(currentVideo.duration);
      }
    }
  }, [relatedData, videoId]);

  // Save to history when video loads
  useEffect(() => {
    if (!videoId || historySaved.current) return;

    const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    setThumbnailUrl((prev) => prev || thumb);

    const timer = setTimeout(() => {
      saveHistoryMutation.mutate({
        sessionId,
        youtubeVideoId: videoId,
        title: videoTitle || `Vídeo ${videoId}`,
        channelName: channelName || undefined,
        channelId: channelId || undefined,
        thumbnailUrl: thumbnailUrl || thumb,
        duration: videoDuration,
        currentTime: existingHistory?.currentTime || 0,
        completed: false,
      });
      historySaved.current = true;
    }, 2000);

    return () => clearTimeout(timer);
  }, [videoId, videoTitle, channelName, sessionId]);

  // Update history periodically
  useEffect(() => {
    if (!videoId) return;

    const interval = setInterval(() => {
      saveHistoryMutation.mutate({
        sessionId,
        youtubeVideoId: videoId,
        title: videoTitle || `Vídeo ${videoId}`,
        channelName: channelName || undefined,
        channelId: channelId || undefined,
        thumbnailUrl: thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: videoDuration,
        currentTime: 0,
        completed: false,
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [videoId, videoTitle, channelName, thumbnailUrl, videoDuration, sessionId]);

  // Reset saved flag when videoId changes
  useEffect(() => {
    historySaved.current = false;
  }, [videoId]);

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
                  ref={iframeRef}
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                  title="YouTube Video Player"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* SponsorBlock Info */}
              {settings?.sponsorBlockEnabled &&
                sponsorSegments &&
                Array.isArray(sponsorSegments) &&
                sponsorSegments.length > 0 && (
                  <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="py-3 px-4 flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="border-amber-500 text-amber-700 dark:text-amber-400"
                      >
                        SponsorBlock
                      </Badge>
                      <span className="text-sm text-amber-700 dark:text-amber-400">
                        {sponsorSegments.length} segmento(s) patrocinado(s) detectado(s) neste
                        vídeo
                      </span>
                    </CardContent>
                  </Card>
                )}

              {/* Video Title */}
              {videoTitle && (
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-foreground">{videoTitle}</h1>
                  {channelName && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {channelName}
                    </p>
                  )}
                </div>
              )}

              {/* Video Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("Funcionalidade em breve!")}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Curtir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${videoId}`);
                    toast.success("Link copiado!");
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ListPlus className="w-4 h-4 mr-2" />
                      Salvar na Playlist
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Salvar na Playlist</DialogTitle>
                      <DialogDescription>
                        Escolha uma playlist para salvar este vídeo
                      </DialogDescription>
                    </DialogHeader>
                    <SaveToPlaylistDialog
                      videoId={videoId}
                      videoTitle={videoTitle}
                      channelName={channelName}
                      channelId={channelId}
                      thumbnailUrl={thumbnailUrl}
                      videoDuration={videoDuration}
                    />
                  </DialogContent>
                </Dialog>
                <SubscribeButton sessionId={sessionId} channelId={channelId} channelName={channelName} />
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://www.youtube.com/watch?v=${videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
                {relatedLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-2">
                      <Skeleton className="w-[168px] h-[94px] rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                {relatedData?.videos
                  ?.filter((video: any) => video && video.videoId !== videoId)
                  .map((video: any) => (
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
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </VideoLayout>
  );
}
