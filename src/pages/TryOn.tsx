import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RealisticAvatar3D } from "@/components/RealisticAvatar3D";
import { Avatar3D } from "@/components/Avatar3D";

interface Avatar {
  id: string;
  name: string;
  face_mesh_url: string | null;
  body_mesh_url: string | null;
  face_texture_url: string | null;
  processed_image_url: string;
}

const TryOn = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [clothingUrl, setClothingUrl] = useState("");
  const [clothingTextureUrl, setClothingTextureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyingClothing, setApplyingClothing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadAvatars();
  }, []);

  useEffect(() => {
    const avatarId = searchParams.get("avatar");
    if (avatarId && avatars.length > 0) {
      const avatar = avatars.find((a) => a.id === avatarId);
      if (avatar) setSelectedAvatar(avatar);
    }
  }, [searchParams, avatars]);

  const loadAvatars = async () => {
    try {
      const { data, error } = await supabase
        .from("avatars")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAvatars(data || []);
    } catch (error: any) {
      toast.error("Failed to load avatars");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (avatarId: string) => {
    const avatar = avatars.find((a) => a.id === avatarId);
    if (avatar) {
      setSelectedAvatar(avatar);
      setSearchParams({ avatar: avatarId });
      setClothingTextureUrl(null);
    }
  };

  const applyClothing = async () => {
    if (!clothingUrl || !selectedAvatar) return;

    setApplyingClothing(true);
    try {
      // Load and validate image
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = clothingUrl;
        setTimeout(() => reject(new Error("Image load timeout")), 10000);
      });

      setClothingTextureUrl(clothingUrl);

      // Save to tried_on_clothes
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("tried_on_clothes").insert({
          user_id: user.id,
          avatar_id: selectedAvatar.id,
          clothing_url: clothingUrl,
        });
      }

      toast.success("Clothing applied!");
    } catch (error: any) {
      toast.error(error.message || "Failed to apply clothing");
    } finally {
      setApplyingClothing(false);
    }
  };

  const toggleFavorite = async () => {
    if (!selectedAvatar || !clothingTextureUrl) {
      toast.error("Please apply clothing first");
      return;
    }

    try {
      const canvas = document.querySelector("canvas");
      if (!canvas) throw new Error("No canvas found");

      const snapshotData = canvas.toDataURL("image/png");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from("outfit_snapshots").insert({
        user_id: user.id,
        avatar_id: selectedAvatar.id,
        clothing_url: clothingTextureUrl,
        snapshot_image: snapshotData,
        is_favorite: true,
      });

      toast.success("Added to favorites!");
    } catch (error: any) {
      toast.error(error.message || "Failed to favorite");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
      </div>
    );
  }

  if (avatars.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="gallery-card max-w-md">
          <CardHeader>
            <CardTitle>No Avatars Yet</CardTitle>
            <CardDescription>Create your first avatar to start trying on clothes</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = "/capture"} variant="kusama" className="w-full">
              Create Avatar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-serif font-bold">Virtual Try-On</h1>
          <p className="text-muted-foreground">Experiment with different looks</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="gallery-card">
            <CardHeader>
              <CardTitle>Your Avatar</CardTitle>
              <Select value={selectedAvatar?.id} onValueChange={handleAvatarChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an avatar" />
                </SelectTrigger>
                <SelectContent>
                  {avatars.map((avatar) => (
                    <SelectItem key={avatar.id} value={avatar.id}>
                      {avatar.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {selectedAvatar && (
                <div className="aspect-square bg-muted rounded-xl overflow-hidden">
                  {selectedAvatar.face_mesh_url && selectedAvatar.body_mesh_url ? (
                    <RealisticAvatar3D
                      faceMeshUrl={selectedAvatar.face_mesh_url}
                      bodyMeshUrl={selectedAvatar.body_mesh_url}
                      faceTextureUrl={selectedAvatar.face_texture_url || undefined}
                      clothingTextureUrl={clothingTextureUrl || undefined}
                    />
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      No 3D model available for this avatar
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="gallery-card">
            <CardHeader>
              <CardTitle>Apply Clothing</CardTitle>
              <CardDescription>Enter a URL to a clothing image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clothingUrl">Clothing Image URL</Label>
                <Input
                  id="clothingUrl"
                  placeholder="https://example.com/shirt.jpg"
                  value={clothingUrl}
                  onChange={(e) => setClothingUrl(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <Button
                onClick={applyClothing}
                variant="kusama"
                className="w-full"
                disabled={!clothingUrl || applyingClothing}
              >
                {applyingClothing ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  "Apply Garment"
                )}
              </Button>

              <div className="pt-4 border-t">
                <Button onClick={toggleFavorite} variant="kusama" className="w-full">
                  <Heart className="mr-2 fill-current" />
                  Save as Favorite
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Saves a snapshot and adds to your favorites
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
};

export default TryOn;
