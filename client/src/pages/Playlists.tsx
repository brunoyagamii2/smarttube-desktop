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
import { Plus, ListVideo, MoreVertical, Trash2, Edit, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Playlists() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
  });

  const utils = trpc.useUtils();

  // Fetch playlists
  const { data: playlists, isLoading } = trpc.playlists.list.useQuery();

  // Create playlist mutation
  const createPlaylistMutation = trpc.playlists.create.useMutation({
    onSuccess: () => {
      toast.success("Playlist criada com sucesso!");
      setCreateDialogOpen(false);
      setCreateForm({ name: "", description: "" });
      utils.playlists.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao criar playlist: " + error.message);
    },
  });

  // Delete playlist mutation
  const deletePlaylistMutation = trpc.playlists.delete.useMutation({
    onSuccess: () => {
      toast.success("Playlist excluída com sucesso!");
      utils.playlists.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao excluir playlist: " + error.message);
    },
  });

  const handleCreate = () => {
    if (!createForm.name) {
      toast.error("O nome da playlist é obrigatório");
      return;
    }

    createPlaylistMutation.mutate({
      name: createForm.name,
      description: createForm.description,
    });
  };

  const handleDelete = (playlistId: number) => {
    if (confirm("Tem certeza que deseja excluir esta playlist?")) {
      deletePlaylistMutation.mutate({ id: playlistId });
    }
  };

  return (
    <VideoLayout>
      <div className="h-full overflow-y-auto">
        <div className="container py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Minhas Playlists</h1>
              <p className="text-muted-foreground">
                {playlists?.length || 0} playlists criadas
              </p>
            </div>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Playlist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Playlist</DialogTitle>
                  <DialogDescription>
                    Organize seus vídeos em playlists personalizadas
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={createForm.name}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, name: e.target.value })
                      }
                      placeholder="Digite o nome da playlist"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={createForm.description}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, description: e.target.value })
                      }
                      placeholder="Digite uma descrição (opcional)"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleCreate}
                    disabled={createPlaylistMutation.isPending}
                    className="w-full"
                  >
                    {createPlaylistMutation.isPending ? "Criando..." : "Criar Playlist"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Playlists Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-video bg-muted animate-pulse" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : playlists && playlists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.map((playlist) => (
                <Card key={playlist.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <Link href={`/playlist/${playlist.id}`}>
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative cursor-pointer">
                      {playlist.thumbnailUrl ? (
                        <img
                          src={playlist.thumbnailUrl}
                          alt={playlist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ListVideo className="w-16 h-16 text-primary" />
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
                          {playlist.name}
                        </h3>
                        {playlist.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {playlist.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Criada em {new Date(playlist.createdAt).toLocaleDateString()}
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
                            onClick={() => handleDelete(playlist.id)}
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
              <ListVideo className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma playlist criada</h3>
              <p className="text-muted-foreground mb-4">
                Organize seus vídeos criando playlists personalizadas
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Playlist
              </Button>
            </div>
          )}
        </div>
      </div>
    </VideoLayout>
  );
}
