import { useState } from "react";
import { useRoute } from "wouter";
import VideoLayout from "@/components/VideoLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Plus, GripVertical, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function PlaylistDetail() {
  const [, params] = useRoute("/playlist/:id");
  const playlistId = params?.id ? parseInt(params.id) : 0;
  const [addVideoDialogOpen, setAddVideoDialogOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Fetch playlist details
  const { data: playlist, isLoading: playlistLoading } = trpc.playlists.getById.useQuery(
    { id: playlistId },
    { enabled: playlistId > 0 }
  );

  // Fetch playlist items
  const { data: playlistItems, isLoading: itemsLoading } = trpc.playlists.getItems.useQuery(
    { playlistId },
    { enabled: playlistId > 0 }
  );

  // Fetch all videos for adding
  const { data: allVideos } = trpc.videos.list.useQuery({ limit: 100 });

  // Remove video mutation
  const removeVideoMutation = trpc.playlists.removeVideo.useMutation({
    onSuccess: () => {
      toast.success("Vídeo removido da playlist!");
      utils.playlists.getItems.invalidate({ playlistId });
    },
    onError: (error) => {
      toast.error("Erro ao remover vídeo: " + error.message);
    },
  });

  // Add video mutation
  const addVideoMutation = trpc.playlists.addVideo.useMutation({
    onSuccess: () => {
      toast.success("Vídeo adicionado à playlist!");
      setAddVideoDialogOpen(false);
      utils.playlists.getItems.invalidate({ playlistId });
    },
    onError: (error) => {
      toast.error("Erro ao adicionar vídeo: " + error.message);
    },
  });

  // Reorder items mutation
  const reorderMutation = trpc.playlists.reorderItems.useMutation({
    onSuccess: () => {
      utils.playlists.getItems.invalidate({ playlistId });
    },
    onError: (error) => {
      toast.error("Erro ao reordenar: " + error.message);
    },
  });

  const handleRemoveVideo = (playlistItemId: number) => {
    if (confirm("Remover este vídeo da playlist?")) {
      removeVideoMutation.mutate({ playlistItemId });
    }
  };

  const handleAddVideo = (videoId: number) => {
    const nextPosition = playlistItems?.length || 0;
    addVideoMutation.mutate({
      playlistId,
      videoId,
      position: nextPosition,
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const items = [...(playlistItems || [])];
    const draggedContent = items[draggedItem];
    items.splice(draggedItem, 1);
    items.splice(index, 0, draggedContent!);

    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    if (draggedItem === null || !playlistItems) return;

    const reorderedItems = playlistItems.map((item, index) => ({
      id: item.id,
      position: index,
    }));

    reorderMutation.mutate({
      playlistId,
      items: reorderedItems,
    });

    setDraggedItem(null);
  };

  if (playlistLoading || itemsLoading) {
    return (
      <VideoLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Carregando playlist...</p>
          </div>
        </div>
      </VideoLayout>
    );
  }

  if (!playlist) {
    return (
      <VideoLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Playlist não encontrada</h2>
            <p className="text-muted-foreground">A playlist que você está procurando não existe.</p>
            <Button asChild>
              <Link href="/playlists">Voltar para Playlists</Link>
            </Button>
          </div>
        </div>
      </VideoLayout>
    );
  }

  const availableVideos = allVideos?.filter(
    (video) => !playlistItems?.some((item) => item.videoId === video.id)
  );

  return (
    <VideoLayout>
      <div className="h-full overflow-y-auto">
        <div className="container py-8 space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <Button variant="ghost" asChild>
              <Link href="/playlists">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Playlists
              </Link>
            </Button>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">{playlist.name}</h1>
                {playlist.description && (
                  <p className="text-muted-foreground">{playlist.description}</p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {playlistItems?.length || 0} vídeos
                </p>
              </div>

              <Dialog open={addVideoDialogOpen} onOpenChange={setAddVideoDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Vídeos
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Adicionar Vídeos à Playlist</DialogTitle>
                    <DialogDescription>
                      Selecione os vídeos que deseja adicionar
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[400px]">
                    {availableVideos && availableVideos.length > 0 ? (
                      <div className="space-y-2">
                        {availableVideos.map((video) => (
                          <Card key={video.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="w-32 h-20 bg-muted rounded flex-shrink-0">
                                  {video.thumbnailUrl ? (
                                    <img
                                      src={video.thumbnailUrl}
                                      alt={video.title}
                                      className="w-full h-full object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Play className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm line-clamp-2">
                                    {video.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {video.views} visualizações
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleAddVideo(video.id)}
                                  disabled={addVideoMutation.isPending}
                                >
                                  Adicionar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          Todos os vídeos já foram adicionados ou não há vídeos disponíveis
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Playlist Items */}
          {playlistItems && playlistItems.length > 0 ? (
            <div className="space-y-2">
              {playlistItems.map((item, index) => (
                <Card
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="overflow-hidden cursor-move hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      
                      <span className="text-sm font-semibold text-muted-foreground w-8">
                        {index + 1}
                      </span>

                      <Link href={`/watch/${item.video?.id}`} className="flex-1">
                        <div className="flex items-center gap-4 cursor-pointer">
                          <div className="w-40 h-24 bg-muted rounded flex-shrink-0">
                            {item.video?.thumbnailUrl ? (
                              <img
                                src={item.video.thumbnailUrl}
                                alt={item.video.title}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold line-clamp-2">
                              {item.video?.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {item.video?.views} visualizações
                            </p>
                          </div>
                        </div>
                      </Link>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveVideo(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Play className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Playlist vazia</h3>
              <p className="text-muted-foreground mb-4">
                Adicione vídeos para começar a montar sua playlist
              </p>
              <Button onClick={() => setAddVideoDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Vídeos
              </Button>
            </div>
          )}
        </div>
      </div>
    </VideoLayout>
  );
}
