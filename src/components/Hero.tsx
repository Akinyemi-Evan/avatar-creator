import heroBanner from "@/assets/hero-banner.jpg";
import { Camera, Sparkles, ShoppingBag } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
      {/* Dark base with subtle gradient */}
      <div 
        className="absolute inset-0 z-0 bg-background"
        style={{ 
          backgroundImage: 'var(--gradient-subtle)',
        }}
      />
      
      {/* Hero banner image with dramatic overlay */}
      <img 
        src={heroBanner} 
        alt="Virtual Try-On Studio" 
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-20 mix-blend-overlay"
        style={{ filter: 'grayscale(100%) contrast(1.2)' }}
      />
      
      {/* Spray paint splatter decorations */}
      <div className="absolute top-20 left-10 w-3 h-3 rounded-full bg-primary opacity-60 blur-[2px]" />
      <div className="absolute top-32 right-16 w-2 h-2 rounded-full bg-secondary opacity-40 blur-[1px]" />
      <div className="absolute bottom-24 left-1/4 w-4 h-4 rounded-full bg-accent opacity-50 blur-[2px]" />
      
      {/* Halftone pattern overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />
      
      {/* Content */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          {/* Main Heading - Stencil Style */}
          <div className="space-y-4 stencil-fade">
            <h1 className="font-display text-6xl md:text-8xl font-black text-foreground leading-[0.95] text-stencil tracking-tight">
              TRY BEFORE
              <span className="block text-primary" style={{ textShadow: '0 0 40px hsla(0, 72%, 63%, 0.5)' }}>
                YOU BUY
              </span>
            </h1>
            
            {/* Accent line */}
            <div className="flex items-center justify-center gap-4">
              <div className="h-[2px] w-20 bg-primary" />
              <div className="h-1 w-1 rounded-full bg-secondary" />
              <div className="h-[2px] w-20 bg-primary" />
            </div>
          </div>
          
          {/* Subheading - Editorial Style */}
          <p className="font-body text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light spray-paint-in">
            Upload your photo, select any clothing from the web, and see how it looks on you instantly with{" "}
            <span className="text-accent font-semibold">AI-powered</span> virtual try-on
          </p>
          
          {/* Features - Gallery Plaques Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-8">
            <div className="group gallery-card p-8 hover:border-primary/50 transition-all duration-300 ink-spread">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Camera className="w-10 h-10 text-primary" />
                  <div className="absolute -inset-2 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-1 text-center">
                  <span className="font-accent text-lg text-foreground block">CAPTURE</span>
                  <span className="text-xs text-muted-foreground font-body">Take Your Photo</span>
                </div>
              </div>
            </div>
            
            <div className="group gallery-card p-8 border-primary/30 hover:border-primary transition-all duration-300 ink-spread">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Sparkles className="w-10 h-10 text-secondary" />
                  <div className="absolute -inset-2 bg-secondary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-1 text-center">
                  <span className="font-accent text-lg text-foreground block">PROCESS</span>
                  <span className="text-xs text-muted-foreground font-body">AI Magic Happens</span>
                </div>
              </div>
            </div>
            
            <div className="group gallery-card p-8 hover:border-primary/50 transition-all duration-300 ink-spread">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <ShoppingBag className="w-10 h-10 text-accent" />
                  <div className="absolute -inset-2 bg-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-1 text-center">
                  <span className="font-accent text-lg text-foreground block">EXPERIENCE</span>
                  <span className="text-xs text-muted-foreground font-body">Try Any Outfit</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Manifesto tagline */}
          <p className="font-accent text-sm text-muted-foreground tracking-wider pt-8">
            WHERE STREET ART MEETS HIGH FASHION
          </p>
        </div>
      </div>
      
      {/* Gallery spotlight effect */}
      <div className="spotlight absolute inset-0 pointer-events-none z-5" />
    </section>
  );
};
