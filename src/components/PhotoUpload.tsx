import { useState, useRef } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { loadImage, removeBackground } from "@/lib/backgroundRemoval";

interface PhotoUploadProps {
  onPhotoProcessed: (imageUrl: string, originalUrl: string) => void;
}

export const PhotoUpload = ({ onPhotoProcessed }: PhotoUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setProcessingStatus("Loading image...");
    
    try {
      // Create original image URL for comparison
      const originalUrl = URL.createObjectURL(file);
      
      // Load image
      const img = await loadImage(file);
      
      // Remove background
      const { blob } = await removeBackground(img, (status) => {
        setProcessingStatus(status);
      });
      
      // Create processed image URL
      const processedUrl = URL.createObjectURL(blob);
      
      onPhotoProcessed(processedUrl, originalUrl);
      toast.success("Photo processed successfully!");
      
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image. Please try another photo.");
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <Card 
        className="max-w-2xl mx-auto p-8 border-2"
        style={{ 
          boxShadow: 'var(--shadow-card)',
          borderColor: 'hsl(var(--border))'
        }}
      >
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-primary)' }}>
              Upload Your Photo
            </h2>
            <p className="text-muted-foreground">
              Take a photo or upload one to get started
            </p>
          </div>
          
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">{processingStatus}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Camera Button */}
              <Button
                size="lg"
                onClick={() => cameraInputRef.current?.click()}
                className="h-32 flex flex-col gap-3 bg-primary hover:bg-primary/90"
                style={{ boxShadow: 'var(--shadow-glow)' }}
              >
                <Camera className="w-8 h-8" />
                <span className="font-semibold">Take Photo</span>
              </Button>
              
              {/* Upload Button */}
              <Button
                size="lg"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-32 flex flex-col gap-3 border-2 hover:bg-accent/10"
              >
                <Upload className="w-8 h-8" />
                <span className="font-semibold">Upload Photo</span>
              </Button>
              
              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFileSelect}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}
          
          <p className="text-xs text-center text-muted-foreground">
            Best results with full-body photos in good lighting
          </p>
        </div>
      </Card>
    </section>
  );
};
