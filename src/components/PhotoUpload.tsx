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
      const originalUrl = URL.createObjectURL(file);
      const img = await loadImage(file);
      const { blob } = await removeBackground(img, (status) => {
        setProcessingStatus(status);
      });
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
    <section className="container mx-auto px-4 py-16">
      <Card className="max-w-2xl mx-auto contact-sheet border-graffiti spray-paint-in">
        <div className="p-10 space-y-8">
          {/* Title - Gallery Label Style */}
          <div className="text-center space-y-4">
            <div className="inline-block">
              <h2 className="font-display text-4xl font-bold text-foreground relative">
                SUBJECT CAPTURE
                <div className="absolute -bottom-2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
              </h2>
            </div>
            <p className="font-body text-muted-foreground text-sm tracking-wide">
              PHOTOGRAPH REQUIRED FOR SPECIMEN ANALYSIS
            </p>
          </div>
          
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-accent text-lg tracking-wider text-primary">{processingStatus}</p>
                <div className="flex gap-1 justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-100" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-200" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Camera Button - Stencil Style */}
              <Button
                size="lg"
                variant="kusama"
                onClick={() => cameraInputRef.current?.click()}
                className="h-40 flex flex-col gap-4"
              >
                <Camera className="w-12 h-12" />
                <span className="font-accent text-xl tracking-widest">CAPTURE</span>
              </Button>
              
              {/* Upload Button - Gallery Frame Style */}
              <Button
                size="lg"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-40 flex flex-col gap-4 border-2 border-border hover:border-secondary group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/5 transition-colors" />
                <Upload className="w-12 h-12 text-muted-foreground group-hover:text-secondary transition-colors relative z-10" />
                <span className="font-accent text-xl tracking-widest text-muted-foreground group-hover:text-foreground transition-colors relative z-10">
                  UPLOAD
                </span>
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
          
          {/* Instructions - Gallery Plaque Style */}
          <div className="border-t border-border pt-6">
            <p className="font-body text-xs text-center text-muted-foreground tracking-wide uppercase">
              Optimal results with full-body photographs • Natural lighting recommended
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
};
