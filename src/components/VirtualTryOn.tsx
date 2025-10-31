import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RealisticAvatar3D } from "./RealisticAvatar3D";
import { Avatar3D } from "./Avatar3D";
import { extractBodyMeasurements } from "@/lib/bodyMeasurements";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { validateImageUrl, loadImageWithTimeout } from "@/lib/validation/urlValidator";
import { TIMEOUT_CONFIG } from "@/lib/constants/avatar3d";

interface VirtualTryOnProps {
  personImageUrl: string;
  originalImageUrl: string;
}

export const VirtualTryOn = ({ personImageUrl, originalImageUrl }: VirtualTryOnProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [clothingTextureUrl, setClothingTextureUrl] = useState<string>("");
  const [clothingUrl, setClothingUrl] = useState<string>("");
  const [faceMeshUrl, setFaceMeshUrl] = useState<string | null>(null);
  const [bodyMeshUrl, setBodyMeshUrl] = useState<string | null>(null);
  const [faceTextureUrl, setFaceTextureUrl] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<string>("");
  
  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    const generateAvatar = async () => {
      if (!personImageUrl) return;
      
      setIsLoading(true);
      setError(null);
      setLoadingProgress("Converting image...");

      try {
        const response = await fetch(personImageUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        setLoadingProgress("Extracting measurements...");
        const measurementsData = await extractBodyMeasurements(personImageUrl);
        setMeasurements(measurementsData);

        setLoadingProgress("Generating 3D avatar (this may take up to 60s)...");
        const avatarData = await supabase.functions.invoke('generate-avatar-features', {
          body: { personImageBase64: base64 }
        });

        if (avatarData.error) {
          console.error('Avatar generation error:', avatarData.error);
          throw new Error(avatarData.error.message || 'Failed to generate 3D avatar');
        }

        if (!avatarData.data?.faceMeshUrl || !avatarData.data?.bodyMeshUrl || !avatarData.data?.faceTextureUrl) {
          console.error('Incomplete avatar data:', avatarData.data);
          throw new Error('Incomplete 3D avatar data received');
        }

        setFaceMeshUrl(avatarData.data.faceMeshUrl);
        setBodyMeshUrl(avatarData.data.bodyMeshUrl);
        setFaceTextureUrl(avatarData.data.faceTextureUrl);

        console.log('Avatar generation successful');
        toast.success("3D avatar generated successfully!");
      } catch (error) {
        console.error('Error generating avatar:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate 3D avatar';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
        setLoadingProgress("");
      }
    };

    generateAvatar();
  }, [personImageUrl]);

  const handleTryOn = async (clothingUrl: string) => {
    if (!clothingUrl) {
      toast.error("Please enter a clothing image URL");
      return;
    }

    const validation = validateImageUrl(clothingUrl);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid clothing image URL");
      console.error('URL validation failed:', validation.error);
      return;
    }

    setIsLoading(true);
    console.log('Loading clothing texture:', clothingUrl);
    
    try {
      await loadImageWithTimeout(clothingUrl, TIMEOUT_CONFIG.textureLoading);
      setClothingTextureUrl(clothingUrl);
      console.log('Clothing texture applied successfully');
      toast.success("Clothing applied successfully!");
    } catch (error) {
      console.error('Error applying clothing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('CORS')) {
        toast.error("Cannot load image due to CORS restrictions. Try a different image URL.");
      } else if (errorMessage.includes('timeout')) {
        toast.error("Image loading timeout. The URL may be too slow or unavailable.");
      } else {
        toast.error("Failed to load clothing image. Please check the URL and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Avatar Display - Gallery Presentation */}
        <Card className="border-graffiti overflow-hidden stencil-fade">
          <CardHeader className="border-b border-border bg-card/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display text-3xl">Specimen 3D</CardTitle>
                <CardDescription className="font-accent text-xs tracking-wider mt-2">
                  RECONSTRUCTED FROM PHOTOGRAPH
                </CardDescription>
              </div>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="p-8 spotlight">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-[500px] gap-6">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse" />
                </div>
                {loadingProgress && (
                  <div className="text-center space-y-2">
                    <p className="font-accent text-sm tracking-wider text-primary">{loadingProgress}</p>
                    <div className="flex gap-1 justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse delay-100" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse delay-200" />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!isLoading && error && (
              <div className="text-center py-16 space-y-4">
                <div className="inline-block p-4 border-2 border-destructive/50 rounded-sm">
                  <p className="font-accent text-destructive tracking-wide">{error}</p>
                </div>
              </div>
            )}
            
            {!isLoading && !error && faceMeshUrl && bodyMeshUrl && (
              <div className="h-[500px]">
                <RealisticAvatar3D
                  faceMeshUrl={faceMeshUrl}
                  bodyMeshUrl={bodyMeshUrl}
                  faceTextureUrl={faceTextureUrl}
                  clothingTextureUrl={clothingTextureUrl}
                />
              </div>
            )}
            
            {!isLoading && !error && measurements && !faceMeshUrl && (
              <div className="h-[500px]">
                <Avatar3D
                  measurements={measurements}
                  clothingTextureUrl={clothingTextureUrl}
                  personImageUrl={personImageUrl}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clothing Try-On - Editorial Style */}
        <Card className="border-graffiti spray-paint-in">
          <CardHeader className="border-b border-border bg-card/50">
            <CardTitle className="font-display text-3xl">Garment Application</CardTitle>
            <CardDescription className="font-accent text-xs tracking-wider mt-2">
              PROVIDE CLOTHING SPECIMEN URL
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Input Field */}
              <div className="space-y-3">
                <label className="font-body text-xs tracking-wider text-muted-foreground uppercase block">
                  Image Source URL
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com/clothing.jpg"
                  value={clothingUrl}
                  onChange={(e) => setClothingUrl(e.target.value)}
                  disabled={isLoading || !measurements}
                  className="border-2 border-border bg-card font-body rounded-sm h-12 focus:border-primary transition-colors"
                />
              </div>
              
              {/* Apply Button */}
              <Button
                variant="kusama"
                onClick={() => handleTryOn(clothingUrl)}
                disabled={isLoading || !clothingUrl || !measurements}
                className="w-full h-14 text-lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>PROCESSING</span>
                  </div>
                ) : (
                  "APPLY GARMENT"
                )}
              </Button>
              
              {/* Instructions */}
              <div className="border-t border-border pt-6 mt-8">
                <p className="font-body text-xs text-muted-foreground text-center tracking-wide uppercase leading-relaxed">
                  Compatible with direct image URLs • CORS-enabled sources preferred
                </p>
              </div>
              
              {/* Decorative elements */}
              <div className="flex justify-center gap-2 pt-4">
                <div className="w-1 h-1 rounded-full bg-primary opacity-60" />
                <div className="w-1 h-1 rounded-full bg-secondary opacity-60" />
                <div className="w-1 h-1 rounded-full bg-accent opacity-60" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
