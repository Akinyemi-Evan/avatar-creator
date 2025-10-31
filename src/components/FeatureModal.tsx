import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FeatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  content: string;
  onStartClick: () => void;
}

export const FeatureModal = ({
  open,
  onOpenChange,
  title,
  description,
  content,
  onStartClick,
}: FeatureModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gallery-card border-graffiti bg-card/95 backdrop-blur-sm">
        {/* Spray-paint decorative splatters */}
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary opacity-40 blur-[1px]" />
        <div className="absolute bottom-6 left-6 w-3 h-3 rounded-full bg-secondary opacity-30 blur-[2px]" />
        
        <DialogHeader className="space-y-6 pt-6">
          <DialogTitle className="font-display text-4xl font-black text-stencil text-foreground">
            {title}
          </DialogTitle>
          <div className="flex items-center gap-4">
            <div className="h-[2px] w-12 bg-primary" />
            <div className="h-1 w-1 rounded-full bg-accent" />
            <div className="h-[2px] w-12 bg-primary" />
          </div>
          <DialogDescription className="font-body text-base text-muted-foreground leading-relaxed font-light">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8 py-6">
          <p className="font-body text-foreground/90 leading-relaxed text-base">
            {content}
          </p>
          
          <Button
            onClick={onStartClick}
            variant="stencil"
            size="lg"
            className="w-full font-accent text-lg tracking-wider"
          >
            START YOUR EXPERIENCE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
