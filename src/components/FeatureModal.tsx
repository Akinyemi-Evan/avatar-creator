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
      <DialogContent className="max-w-2xl gallery-card bg-card/98 backdrop-blur-md">
        {/* Floating polka dot decorations */}
        <div className="absolute top-8 right-8 w-4 h-4 rounded-full bg-primary opacity-30 animate-dot-bloom" />
        <div className="absolute bottom-8 left-8 w-3 h-3 rounded-full bg-secondary opacity-25 animate-dot-bloom" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 right-12 w-2 h-2 rounded-full bg-accent opacity-20 animate-float" />
        
        <DialogHeader className="space-y-6 pt-6">
          <DialogTitle className="font-display text-4xl font-black text-elegant text-foreground">
            {title}
          </DialogTitle>
          <div className="flex items-center justify-center gap-3">
            <div className="h-[2px] w-16 bg-primary rounded-full" />
            <div className="h-2 w-2 rounded-full bg-secondary" />
            <div className="h-[2px] w-16 bg-accent rounded-full" />
          </div>
          <DialogDescription className="font-body text-base text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8 py-6">
          <p className="font-body text-foreground/90 leading-relaxed text-base">
            {content}
          </p>
          
          <Button
            onClick={onStartClick}
            variant="kusama"
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
