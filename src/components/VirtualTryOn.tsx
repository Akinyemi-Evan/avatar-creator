import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Link as LinkIcon, Download } from "lucide-react";
import { toast } from "sonner";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";

interface VirtualTryOnProps {
  personImageUrl: string;
  originalImageUrl: string;
}

export const VirtualTryOn = ({ personImageUrl, originalImageUrl }: VirtualTryOnProps) => {
  const [clothingUrl, setClothingUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);

  const handleTryOn = async () => {
    if (!clothingUrl.trim()) {
      toast.error("Please enter a clothing image URL");
      return;
    }

    setIsLoading(true);
    
    try {
      // Load clothing image
      const clothingImg = new Image();
      clothingImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        clothingImg.onload = resolve;
        clothingImg.onerror = () => reject(new Error("Failed to load clothing image"));
        clothingImg.src = clothingUrl;
      });

      // Load person image
      const personImg = new Image();
      await new Promise((resolve, reject) => {
        personImg.onload = resolve;
        personImg.onerror = reject;
        personImg.src = personImageUrl;
      });

      // Create composite canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");

      canvas.width = personImg.width;
      canvas.height = personImg.height;

      // Draw person image
      ctx.drawImage(personImg, 0, 0);

      // Calculate clothing placement (torso area)
      const clothingWidth = canvas.width * 0.6;
      const clothingHeight = clothingWidth * (clothingImg.height / clothingImg.width);
      const xPos = (canvas.width - clothingWidth) / 2;
      const yPos = canvas.height * 0.25; // Position in upper body area

      // Apply blend mode for realistic try-on effect
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.7;
      ctx.drawImage(clothingImg, xPos, yPos, clothingWidth, clothingHeight);
      
      // Reset composite operation and draw clothing with normal blend
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.8;
      ctx.drawImage(clothingImg, xPos, yPos, clothingWidth, clothingHeight);

      // Convert to blob and create URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setTryOnResult(url);
          toast.success("Virtual try-on complete!");
        }
      }, "image/png");

    } catch (error) {
      console.error("Error during virtual try-on:", error);
      toast.error("Failed to load clothing image. Please check the URL.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (tryOnResult) {
      const link = document.createElement("a");
      link.href = tryOnResult;
      link.download = "virtual-tryon-result.png";
      link.click();
      toast.success("Image downloaded!");
    }
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* URL Input Card */}
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
                Select Clothing
              </h3>
              <p className="text-sm text-muted-foreground">
                Paste the URL of any clothing image from the web
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
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleTryOn}
                disabled={isLoading || !clothingUrl.trim()}
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
                    Try On
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Results */}
        {tryOnResult && (
          <Card 
            className="p-6 border-2"
            style={{ 
              boxShadow: 'var(--shadow-card)',
              borderColor: 'hsl(var(--border))'
            }}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-primary)' }}>
                  Virtual Try-On Result
                </h3>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
              
              <div className="rounded-xl overflow-hidden border-2 border-border">
                <ReactCompareSlider
                  itemOne={
                    <ReactCompareSliderImage
                      src={originalImageUrl}
                      alt="Original"
                    />
                  }
                  itemTwo={
                    <ReactCompareSliderImage
                      src={tryOnResult}
                      alt="Try-On Result"
                    />
                  }
                  style={{
                    height: "600px",
                    width: "100%",
                  }}
                />
              </div>
              
              <p className="text-center text-sm text-muted-foreground">
                Drag the slider to compare before and after
              </p>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
};
