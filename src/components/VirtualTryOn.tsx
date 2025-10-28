import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar3D } from "@/components/Avatar3D";
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

  // Extract body measurements when person image is loaded
  useEffect(() => {
    const loadMeasurements = async () => {
      setIsLoading(true);
      try {
        const extracted = await extractBodyMeasurements(personImageUrl);
        setMeasurements(extracted);
        toast.success("3D avatar generated from your photo!");
      } catch (error) {
        console.error("Error extracting measurements:", error);
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

    loadMeasurements();
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
            
            {measurements ? (
              <Avatar3D measurements={measurements} clothingTextureUrl={clothingTextureUrl} personImageUrl={personImageUrl} />
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
