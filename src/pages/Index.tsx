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
      
      {/* Footer - Gallery Credits Style */}
      <footer className="border-t border-border mt-32 bg-card/30">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-center gap-4 items-center">
              <div className="h-[1px] w-20 bg-border" />
              <p className="font-accent text-sm text-muted-foreground tracking-widest">
                VIRTUAL TRY-ON STUDIO
              </p>
              <div className="h-[1px] w-20 bg-border" />
            </div>
            
            <p className="text-center font-body text-xs text-muted-foreground tracking-wide">
              Powered by AI • Where Technology Meets Fashion
            </p>
            
            {/* Decorative spray paint dots */}
            <div className="flex justify-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-50" />
              <div className="w-1.5 h-1.5 rounded-full bg-secondary opacity-50" />
              <div className="w-1.5 h-1.5 rounded-full bg-accent opacity-50" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
