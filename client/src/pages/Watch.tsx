import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import VideoLayout from "@/components/VideoLayout";
import VideoPlayer from "@/components/VideoPlayer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ThumbsUp, 
  Share2, 
  ListPlus, 
  Download,
  Sparkles,
  Subtitles,
} from "lucide-react";
import { toast } from "sonner";

export default function Watch() {
  const [, params] = useRoute("/watch/:id");
  const videoId = params?.id ? parseInt(params.id) : 0;
  const [sponsorSegments, setSponsorSegments] = useState<any[]>([]);

  const utils = trpc.useUtils();

  // Fetch video details
  const { data: video, isLoading } = trpc.videos.getById.useQuery(
    { id: videoId },
    { enabled: videoId > 0 }
  );

  // Fetch watch history
  const { data: watchHistory } = trpc.history.getForVideo.useQuery(
    { videoId },
    { enabled: videoId > 0 }
  );

  // Fetch user settings
  const { data: settings } = trpc.settings.get.useQuery();

  // Fetch transcriptions
  const { data: transcriptions } = trpc.videos.getTranscriptions.useQuery(
    { videoId },
    { enabled: videoId > 0 }
  );

  // Update watch history mutation
  const updateHistoryMutation = trpc.history.update.useMutation();

  // Increment views mutation
  const incrementViewsMutation = trpc.videos.incrementViews.useMutation();

  // Generate thumbnail mutation
  const generateThumbnailMutation = trpc.videos.generateThumbnail.useMutation({
    onSuccess: () => {
      toast.success("Miniatura gerada com sucesso!");
      utils.videos.getById.invalidate({ id: videoId });
    },
    onError: (error) => {
      toast.error("Erro ao gerar miniatura: " + error.message);
    },
  });

  // Transcribe video mutation
  const transcribeMutation = trpc.videos.transcribe.useMutation({
    onSuccess: () => {
      toast.success("Transcrição gerada com sucesso!");
      utils.videos.getTranscriptions.invalidate({ videoId });
    },
    onError: (error) => {
      toast.error("Erro ao transcrever: " + error.message);
    },
  });

  // Fetch SponsorBlock segments
  const { data: sponsorBlockData } = trpc.sponsorBlock.getSegments.useQuery(
    {
      videoId: video?.videoUrl || "",
      categories: settings?.sponsorBlockCategories || undefined,
    },
    {
      enabled: !!video && settings?.sponsorBlockEnabled === true,
    }
  );

  useEffect(() => {
    if (sponsorBlockData) {
      setSponsorSegments(sponsorBlockData);
    }
  }, [sponsorBlockData]);

  // Increment views on mount
  useEffect(() => {
    if (videoId > 0) {
      incrementViewsMutation.mutate({ id: videoId });
    }
  }, [videoId]);

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    // Update watch history every 5 seconds
    if (Math.floor(currentTime) % 5 === 0) {
      updateHistoryMutation.mutate({
        videoId,
        currentTime,
        duration,
        completed: currentTime / duration > 0.9,
      });
    }
  };

  const handleGenerateThumbnail = () => {
    if (!video) return;
    
    const prompt = `Create a professional video thumbnail for: ${video.title}. Modern, eye-catching design with vibrant colors.`;
    generateThumbnailMutation.mutate({
      videoId: video.id,
      prompt,
    });
  };

  const handleTranscribe = () => {
    if (!video) return;
    
    transcribeMutation.mutate({
      videoId: video.id,
      audioUrl: video.videoUrl,
      language: "pt",
    });
  };

  if (isLoading) {
    return (
      <VideoLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Carregando vídeo...</p>
          </div>
        </div>
      </VideoLayout>
    );
  }

  if (!video) {
    return (
      <VideoLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Vídeo não encontrado</h2>
            <p className="text-muted-foreground">O vídeo que você está procurando não existe.</p>
          </div>
        </div>
      </VideoLayout>
    );
  }

  return (
    <VideoLayout>
      <div className="h-full overflow-y-auto">
        <div className="container py-6 space-y-6">
          {/* Video Player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <VideoPlayer
              videoUrl={video.videoUrl}
              videoId={video.id}
              onTimeUpdate={handleTimeUpdate}
              initialTime={watchHistory?.currentTime || 0}
              sponsorSegments={sponsorSegments}
              className="w-full h-full"
            />
          </div>

          {/* Video Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{video.views} visualizações</span>
                <span>•</span>
                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                {video.quality && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary">{video.quality}</Badge>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm">
                <ThumbsUp className="w-4 h-4 mr-2" />
                Curtir
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
              <Button variant="outline" size="sm">
                <ListPlus className="w-4 h-4 mr-2" />
                Adicionar à Playlist
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            {/* AI Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Recursos de IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Gerar Miniatura Personalizada</p>
                    <p className="text-sm text-muted-foreground">
                      Crie uma miniatura atraente usando IA
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateThumbnail}
                    disabled={generateThumbnailMutation.isPending}
                    size="sm"
                  >
                    {generateThumbnailMutation.isPending ? "Gerando..." : "Gerar"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Transcrição Automática</p>
                    <p className="text-sm text-muted-foreground">
                      Gere legendas usando Whisper AI
                    </p>
                  </div>
                  <Button
                    onClick={handleTranscribe}
                    disabled={transcribeMutation.isPending}
                    size="sm"
                  >
                    {transcribeMutation.isPending ? "Transcrevendo..." : "Transcrever"}
                  </Button>
                </div>

                {settings?.sponsorBlockEnabled && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SponsorBlock Ativo</p>
                      <p className="text-sm text-muted-foreground">
                        {sponsorSegments.length} segmentos detectados
                      </p>
                    </div>
                    <Badge variant="secondary">Ativo</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="description">
              <TabsList>
                <TabsTrigger value="description">Descrição</TabsTrigger>
                <TabsTrigger value="transcriptions">
                  <Subtitles className="w-4 h-4 mr-2" />
                  Transcrições ({transcriptions?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {video.description ? (
                      <p className="whitespace-pre-wrap">{video.description}</p>
                    ) : (
                      <p className="text-muted-foreground">Sem descrição</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transcriptions" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {transcriptions && transcriptions.length > 0 ? (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {transcriptions.map((trans) => (
                            <div key={trans.id} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge>{trans.language}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(trans.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded">
                                {trans.transcription}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-8">
                        <Subtitles className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          Nenhuma transcrição disponível
                        </p>
                        <Button
                          onClick={handleTranscribe}
                          disabled={transcribeMutation.isPending}
                          className="mt-4"
                          size="sm"
                        >
                          Gerar Transcrição
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </VideoLayout>
  );
}
