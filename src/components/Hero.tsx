import heroBanner from "@/assets/hero-banner.jpg";
import aiIcon from "@/assets/ai-icon.png";
import { Camera, Sparkles, ShoppingBag } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{ 
          background: 'var(--gradient-primary)',
          opacity: 0.95
        }}
      />
      
      {/* Hero banner image */}
      <img 
        src={heroBanner} 
        alt="Virtual Try-On" 
        className="absolute inset-0 w-full h-full object-cover z-0 mix-blend-overlay"
      />
      
      {/* Content */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <img 
              src={aiIcon} 
              alt="AI Icon" 
              className="w-24 h-24 animate-pulse"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          
          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground leading-tight">
            Try Before You Buy
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto">
            Upload your photo, select any clothing from the web, and see how it looks on you instantly with AI-powered virtual try-on
          </p>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto pt-8">
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/10 backdrop-blur-sm border border-primary-foreground/10">
              <Camera className="w-8 h-8 text-primary-foreground" />
              <span className="text-sm font-medium text-primary-foreground">Take a Photo</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/10 backdrop-blur-sm border border-primary-foreground/10">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
              <span className="text-sm font-medium text-primary-foreground">AI Processing</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/10 backdrop-blur-sm border border-primary-foreground/10">
              <ShoppingBag className="w-8 h-8 text-primary-foreground" />
              <span className="text-sm font-medium text-primary-foreground">Try On Clothes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
