import { useState } from "react";
import { Hero } from "@/components/Hero";
import { PhotoUpload } from "@/components/PhotoUpload";
import { VirtualTryOn } from "@/components/VirtualTryOn";

const Index = () => {
  const [personImageUrl, setPersonImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  const handlePhotoProcessed = (processedUrl: string, originalUrl: string) => {
    setPersonImageUrl(processedUrl);
    setOriginalImageUrl(originalUrl);
  };

  return (
    <div className="min-h-screen">
      <Hero />
      
      <PhotoUpload onPhotoProcessed={handlePhotoProcessed} />
      
      {personImageUrl && originalImageUrl && (
        <VirtualTryOn 
          personImageUrl={personImageUrl}
          originalImageUrl={originalImageUrl}
        />
      )}
      
      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-sm text-muted-foreground">
            Powered by AI • Virtual Try-On Studio
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
