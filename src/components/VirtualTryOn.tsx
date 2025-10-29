import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar3D } from "@/components/Avatar3D";
import { RealisticAvatar3D } from "@/components/RealisticAvatar3D";
import { extractBodyMeasurements, BodyMeasurements } from "@/lib/bodyMeasurements";

interface VirtualTryOnProps {
  personImageUrl: string;
  originalImageUrl: string;
}

export const VirtualTryOn = ({ personImageUrl, originalImageUrl }: VirtualTryOnProps) => {
  const [clothingUrl, setClothingUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [measurements, setMeasurements] = useState<BodyMeasurements | null>(null);
  const [clothingTextureUrl, setClothingTextureUrl] = useState<string | null>(null);
  const [enhancedPersonImageUrl, setEnhancedPersonImageUrl] = useState<string | null>(null);
  const [mesh3DUrl, setMesh3DUrl] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<any>({});

  // Extract body measurements and generate enhanced texture when person image is loaded
  useEffect(() => {
    const loadAvatarData = async () => {
      setIsLoading(true);
      try {
        // Convert blob URL to base64 for backend processing
        const blobToBase64 = async (url: string): Promise<string> => {
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        };

        const imageBase64 = await blobToBase64(personImageUrl);

        // Extract measurements and generate AI-enhanced texture in parallel
        const [extracted, response] = await Promise.all([
          extractBodyMeasurements(personImageUrl),
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-avatar-features`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ personImageBase64: imageBase64 })
          }).then(res => res.json())
        ]);

        setMeasurements(extracted);
        setAiResponse(response);
        
        if (response.error) {
          console.error("Replicate API error:", response.error);
          toast.error("Failed to generate avatar with Replicate AI");
        } else if (response.mesh3DUrl) {
          console.log("3D mesh received:", response.mesh3DUrl);
          setMesh3DUrl(response.mesh3DUrl);
          setEnhancedPersonImageUrl(response.enhancedTextureUrl);
          toast.success("Production-quality 3D avatar generated!");
        } else if (response.enhancedTextureUrl) {
          console.log("AI-enhanced texture received:", response.enhancedTextureUrl.substring(0, 50) + "...");
          setEnhancedPersonImageUrl(response.enhancedTextureUrl);
          toast.success("Photo enhanced with Replicate AI!");
        } else {
          console.log("No enhanced texture in response:", response);
          toast.success("3D avatar generated from your photo!");
        }
      } catch (error) {
        console.error("Error processing photo:", error);
        toast.error("Failed to analyze photo. Using default avatar.");
        setMeasurements({
          height: 1.0,
          shoulderWidth: 1.0,
          torsoLength: 1.0,
          armLength: 1.0,
          legLength: 1.0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAvatarData();
  }, [personImageUrl]);

  const handleTryOn = async () => {
    if (!clothingUrl.trim()) {
      toast.error("Please enter a clothing image URL");
      return;
    }

    setIsLoading(true);
    try {
      // Load the clothing image to verify it's valid
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = clothingUrl;
      });

      setClothingTextureUrl(clothingUrl);
      toast.success("Clothing applied to your avatar!");
    } catch (error) {
      console.error("Error loading clothing:", error);
      toast.error("Failed to load clothing image. Please check the URL.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Avatar Display */}
        <Card 
          className="p-6 border-2"
          style={{ 
            boxShadow: 'var(--shadow-card)',
            borderColor: 'hsl(var(--border))'
          }}
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold mb-2 bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-primary)' }}>
                Your 3D Avatar
              </h3>
              <p className="text-sm text-muted-foreground">
                Generated from your photo • Drag to rotate • Scroll to zoom
              </p>
            </div>
            
            {measurements && !aiResponse.error ? (
              mesh3DUrl ? (
                <RealisticAvatar3D 
                  meshUrl={mesh3DUrl}
                  clothingTextureUrl={clothingTextureUrl}
                />
              ) : (
                <Avatar3D 
                  measurements={measurements} 
                  clothingTextureUrl={clothingTextureUrl} 
                  personImageUrl={enhancedPersonImageUrl || personImageUrl} 
                />
              )
            ) : aiResponse.error ? (
              <div className="h-[600px] flex items-center justify-center border border-border rounded-lg bg-background/50">
                <div className="text-center max-w-md px-4">
                  <div className="text-6xl mb-4">⚠️</div>
                  <p className="text-lg font-semibold mb-2 text-destructive">Avatar Generation Failed</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Unable to connect to Replicate AI service. Please check your API key and try again.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Error: {aiResponse.error}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-[600px] flex items-center justify-center border border-border rounded-lg bg-background/50">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Analyzing photo and generating avatar...</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Clothing Input */}
        <Card 
          className="p-6 border-2"
          style={{ 
            boxShadow: 'var(--shadow-card)',
            borderColor: 'hsl(var(--border))'
          }}
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold mb-2 bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-primary)' }}>
                Try On Clothing
              </h3>
              <p className="text-sm text-muted-foreground">
                Paste the URL of any clothing image to see it on your avatar
              </p>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="https://example.com/shirt.jpg"
                  value={clothingUrl}
                  onChange={(e) => setClothingUrl(e.target.value)}
                  className="h-12"
                  disabled={isLoading || !measurements}
                />
              </div>
              <Button
                onClick={handleTryOn}
                disabled={isLoading || !clothingUrl.trim() || !measurements}
                className="h-12 px-8 bg-primary hover:bg-primary/90"
                style={{ boxShadow: 'var(--shadow-glow)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Apply to Avatar
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
