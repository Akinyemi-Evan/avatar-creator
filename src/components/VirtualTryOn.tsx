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
  
  // Track blob URLs for cleanup
  const blobUrlsRef = useRef<string[]>([]);

  // Cleanup blob URLs on unmount
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
        // Convert image URL to base64
        const response = await fetch(personImageUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        setLoadingProgress("Extracting measurements...");
        // Extract measurements first (fast operation)
        const measurementsData = await extractBodyMeasurements(personImageUrl);
        setMeasurements(measurementsData);

        setLoadingProgress("Generating 3D avatar (this may take up to 60s)...");
        // Generate 3D meshes (slow operation)
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

    // Validate URL format and security
    const validation = validateImageUrl(clothingUrl);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid clothing image URL");
      console.error('URL validation failed:', validation.error);
      return;
    }

    setIsLoading(true);
    console.log('Loading clothing texture:', clothingUrl);
    
    try {
      // Preload image with timeout and CORS handling
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
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Avatar Display */}
        <Card>
          <CardHeader>
            <CardTitle>Your 3D Avatar</CardTitle>
            <CardDescription>Generated from your photo</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                {loadingProgress && (
                  <p className="text-sm text-muted-foreground">{loadingProgress}</p>
                )}
              </div>
            )}
            
            {!isLoading && error && (
              <div className="text-center py-8">
                <p className="text-destructive">{error}</p>
              </div>
            )}
            
            {!isLoading && !error && faceMeshUrl && bodyMeshUrl && (
              <RealisticAvatar3D
                faceMeshUrl={faceMeshUrl}
                bodyMeshUrl={bodyMeshUrl}
                faceTextureUrl={faceTextureUrl}
                clothingTextureUrl={clothingTextureUrl}
              />
            )}
            
            {!isLoading && !error && measurements && !faceMeshUrl && (
              <Avatar3D
                measurements={measurements}
                clothingTextureUrl={clothingTextureUrl}
                personImageUrl={personImageUrl}
              />
            )}
          </CardContent>
        </Card>

        {/* Clothing Try-On */}
        <Card>
          <CardHeader>
            <CardTitle>Try On Clothing</CardTitle>
            <CardDescription>Enter a clothing image URL</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="url"
                placeholder="https://example.com/clothing.jpg"
                value={clothingUrl}
                onChange={(e) => setClothingUrl(e.target.value)}
                disabled={isLoading || !measurements}
              />
              <Button
                onClick={() => handleTryOn(clothingUrl)}
                disabled={isLoading || !clothingUrl || !measurements}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Apply Clothing"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
