import { useState } from "react";
import VideoLayout from "@/components/VideoLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Upload, Play, MoreVertical, Trash2, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Library() {
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    duration: 0,
  });

  const utils = trpc.useUtils();
  
  // Fetch videos
  const { data: videos, isLoading } = trpc.videos.list.useQuery({
    limit: 50,
    offset: 0,
  });

  // Search videos
  const { data: searchResults } = trpc.videos.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  // Create video mutation
  const createVideoMutation = trpc.videos.create.useMutation({
    onSuccess: () => {
      toast.success("Vídeo adicionado com sucesso!");
      setUploadDialogOpen(false);
      setUploadForm({ title: "", description: "", videoUrl: "", duration: 0 });
      utils.videos.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar vídeo: " + error.message);
    },
  });

  // Delete video mutation
  const deleteVideoMutation = trpc.videos.delete.useMutation({
    onSuccess: () => {
      toast.success("Vídeo excluído com sucesso!");
      utils.videos.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao excluir vídeo: " + error.message);
    },
  });

  const handleUpload = () => {
    if (!uploadForm.title || !uploadForm.videoUrl) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createVideoMutation.mutate({
      title: uploadForm.title,
      description: uploadForm.description,
      videoUrl: uploadForm.videoUrl,
      duration: uploadForm.duration || 0,
    });
  };

  const handleDelete = (videoId: number) => {
    if (confirm("Tem certeza que deseja excluir este vídeo?")) {
      deleteVideoMutation.mutate({ id: videoId });
    }
  };

  const displayVideos = searchQuery ? searchResults : videos;

  return (
    <VideoLayout>
      <div className="h-full overflow-y-auto">
        <div className="container py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Biblioteca de Vídeos</h1>
              <p className="text-muted-foreground">
                {displayVideos?.length || 0} vídeos disponíveis
              </p>
            </div>

            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Adicionar Vídeo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Vídeo</DialogTitle>
                  <DialogDescription>
                    Preencha as informações do vídeo abaixo
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={uploadForm.title}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, title: e.target.value })
                      }
                      placeholder="Digite o título do vídeo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={uploadForm.description}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, description: e.target.value })
                      }
                      placeholder="Digite uma descrição"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="videoUrl">URL do Vídeo *</Label>
                    <Input
                      id="videoUrl"
                      value={uploadForm.videoUrl}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, videoUrl: e.target.value })
                      }
                      placeholder="https://exemplo.com/video.mp4"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duração (segundos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={uploadForm.duration}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, duration: parseInt(e.target.value) || 0 })
                      }
                      placeholder="0"
                    />
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={createVideoMutation.isPending}
                    className="w-full"
                  >
                    {createVideoMutation.isPending ? "Adicionando..." : "Adicionar Vídeo"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar vídeos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Video Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-video bg-muted animate-pulse" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : displayVideos && displayVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <Link href={`/watch/${video.id}`}>
                    <div className="aspect-video bg-muted relative cursor-pointer">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-16 h-16 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                          {video.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {video.views} visualizações
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(video.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Play className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum vídeo encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Tente buscar com outros termos"
                  : "Comece adicionando seus primeiros vídeos"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Adicionar Vídeo
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </VideoLayout>
  );
}
