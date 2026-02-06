import { useState, useEffect } from "react";
import VideoLayout from "@/components/VideoLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function Settings() {
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const updateSettingsMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    },
  });

  const [localSettings, setLocalSettings] = useState({
    defaultPlaybackSpeed: 1.0,
    autoplay: true,
    sponsorBlockEnabled: true,
    sponsorBlockCategories: ["sponsor", "intro", "outro", "selfpromo"],
    autoGenerateCaptions: false,
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        defaultPlaybackSpeed: settings.defaultPlaybackSpeed,
        autoplay: settings.autoplay,
        sponsorBlockEnabled: settings.sponsorBlockEnabled,
        sponsorBlockCategories: settings.sponsorBlockCategories || [],
        autoGenerateCaptions: settings.autoGenerateCaptions,
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettingsMutation.mutate(localSettings);
  };

  const sponsorBlockOptions = [
    { id: "sponsor", label: "Patrocínios", description: "Segmentos patrocinados" },
    { id: "intro", label: "Intros", description: "Introduções e animações iniciais" },
    { id: "outro", label: "Outros", description: "Créditos finais e outros" },
    { id: "selfpromo", label: "Auto-promoção", description: "Promoção de outros vídeos do canal" },
    { id: "interaction", label: "Interação", description: "Lembretes de inscrição e curtidas" },
    { id: "music_offtopic", label: "Não-música", description: "Partes não musicais em vídeos de música" },
  ];

  const toggleCategory = (categoryId: string) => {
    setLocalSettings((prev) => {
      const categories = prev.sponsorBlockCategories.includes(categoryId)
        ? prev.sponsorBlockCategories.filter((c) => c !== categoryId)
        : [...prev.sponsorBlockCategories, categoryId];
      return { ...prev, sponsorBlockCategories: categories };
    });
  };

  if (isLoading) {
    return (
      <VideoLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      </VideoLayout>
    );
  }

  return (
    <VideoLayout>
      <div className="h-full overflow-y-auto">
        <div className="container py-8 space-y-6 max-w-4xl">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground">
              Personalize sua experiência de reprodução de vídeos
            </p>
          </div>

          {/* Playback Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Reprodução</CardTitle>
              <CardDescription>
                Configure as preferências de reprodução de vídeos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Velocidade de Reprodução Padrão: {localSettings.defaultPlaybackSpeed}x</Label>
                <Slider
                  value={[localSettings.defaultPlaybackSpeed]}
                  min={0.25}
                  max={2}
                  step={0.25}
                  onValueChange={(value) =>
                    setLocalSettings({ ...localSettings, defaultPlaybackSpeed: value[0]! })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Velocidade inicial ao reproduzir vídeos
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reprodução Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Iniciar automaticamente o próximo vídeo da playlist
                  </p>
                </div>
                <Switch
                  checked={localSettings.autoplay}
                  onCheckedChange={(checked) =>
                    setLocalSettings({ ...localSettings, autoplay: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* SponsorBlock Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SponsorBlock</CardTitle>
              <CardDescription>
                Pule automaticamente segmentos indesejados nos vídeos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativar SponsorBlock</Label>
                  <p className="text-sm text-muted-foreground">
                    Usar dados da comunidade para pular segmentos
                  </p>
                </div>
                <Switch
                  checked={localSettings.sponsorBlockEnabled}
                  onCheckedChange={(checked) =>
                    setLocalSettings({ ...localSettings, sponsorBlockEnabled: checked })
                  }
                />
              </div>

              {localSettings.sponsorBlockEnabled && (
                <div className="space-y-4">
                  <Label>Categorias para Pular</Label>
                  <div className="space-y-3">
                    {sponsorBlockOptions.map((option) => (
                      <div key={option.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={option.id}
                          checked={localSettings.sponsorBlockCategories.includes(option.id)}
                          onCheckedChange={() => toggleCategory(option.id)}
                        />
                        <div className="space-y-0.5">
                          <Label htmlFor={option.id} className="cursor-pointer">
                            {option.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Features */}
          <Card>
            <CardHeader>
              <CardTitle>Recursos de IA</CardTitle>
              <CardDescription>
                Configure funcionalidades baseadas em inteligência artificial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Gerar Legendas Automaticamente</Label>
                  <p className="text-sm text-muted-foreground">
                    Usar Whisper AI para transcrever novos vídeos automaticamente
                  </p>
                </div>
                <Switch
                  checked={localSettings.autoGenerateCaptions}
                  onCheckedChange={(checked) =>
                    setLocalSettings({ ...localSettings, autoGenerateCaptions: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending}
              size="lg"
            >
              {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      </div>
    </VideoLayout>
  );
}
