import { useState } from "react";
import heroBanner from "@/assets/hero-banner.jpg";
import { Camera, Sparkles, ShoppingBag } from "lucide-react";
import { FeatureModal } from "@/components/FeatureModal";

type FeatureType = "capture" | "process" | "experience" | null;

export const Hero = () => {
  const [openFeature, setOpenFeature] = useState<FeatureType>(null);

  const scrollToCapture = () => {
    setOpenFeature(null);
    setTimeout(() => {
      const element = document.getElementById("capture-section");
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const featureContent = {
    capture: {
      title: "CAPTURE YOUR ESSENCE",
      description: "Precision body analysis powered by AI",
      content:
        "We take your photo and use advanced AI to analyze your body measurements. Our system maps 23+ key points on your body to create an accurate digital profile. This ensures your virtual try-on experience is as realistic as possible.",
    },
    process: {
      title: "PROCESS WITH AI PRECISION",
      description: "Transform your photo into a 3D masterpiece",
      content:
        "Our AI processes your photo and measurements to create a stunning 3D replica of you. Using cutting-edge DECA face reconstruction and PIFuHD body modeling, we generate a photorealistic avatar that captures your unique proportions and features.",
    },
    experience: {
      title: "EXPERIENCE ENDLESS POSSIBILITIES",
      description: "See how any outfit looks on you",
      content:
        "Customize your 3D avatar with any clothing from the internet. Simply paste a product URL, and watch as AI seamlessly fits the garment to your digital twin. See exactly how clothes will look and fit on your body before making a purchase - no more sizing guesswork.",
    },
  };
  return (
    <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden polka-pattern">
      {/* Light background with subtle gradient */}
      <div 
        className="absolute inset-0 z-0 bg-background"
        style={{ 
          backgroundImage: 'var(--gradient-subtle)',
        }}
      />
      
      {/* Hero banner image with light overlay */}
      <img 
        src={heroBanner} 
        alt="Virtual Try-On Studio" 
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-[0.08] mix-blend-multiply"
      />
      
      {/* Floating polka dot decorations */}
      <div className="absolute top-20 left-10 w-8 h-8 rounded-full bg-primary opacity-20 animate-float" />
      <div className="absolute top-32 right-16 w-6 h-6 rounded-full bg-secondary opacity-15 animate-float" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-24 left-1/4 w-10 h-10 rounded-full bg-accent opacity-15 animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/4 w-4 h-4 rounded-full bg-primary opacity-25 animate-dot-bloom" />
      
      {/* Content */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          {/* Main Heading - Elegant Display */}
          <div className="space-y-6 fade-in">
            <h1 className="font-display text-6xl md:text-8xl font-black text-foreground leading-[0.95] text-elegant tracking-tight">
              TRY BEFORE
              <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                YOU BUY
              </span>
            </h1>
            
            {/* Polka dot accent line */}
            <div className="flex items-center justify-center gap-3">
              <div className="h-[2px] w-24 bg-primary rounded-full" />
              <div className="h-2 w-2 rounded-full bg-secondary animate-dot-bloom" />
              <div className="h-[2px] w-24 bg-accent rounded-full" />
            </div>
          </div>
          
          {/* Subheading - Clean Editorial Style */}
          <p className="font-body text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Upload your photo, select any clothing from the web, and see how it looks on you instantly with{" "}
            <span className="text-primary font-semibold">AI-powered</span> virtual try-on
          </p>
          
          {/* Features - Kusama-inspired Cards - Now Clickable */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-8 animate-soft-scale" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={() => setOpenFeature("capture")}
              className="group gallery-card p-8 hover:shadow-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left bg-card hover:bg-card/80"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Camera className="w-12 h-12 text-primary relative z-10" />
                </div>
                <div className="space-y-2 text-center">
                  <span className="font-accent text-xl text-foreground block font-semibold">
                    CAPTURE
                  </span>
                  <span className="text-sm text-muted-foreground font-body">
                    Take Your Photo
                  </span>
                </div>
              </div>
            </button>

            <button
              onClick={() => setOpenFeature("process")}
              className="group gallery-card p-8 hover:shadow-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left bg-card hover:bg-card/80"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Sparkles className="w-12 h-12 text-secondary relative z-10" />
                </div>
                <div className="space-y-2 text-center">
                  <span className="font-accent text-xl text-foreground block font-semibold">
                    PROCESS
                  </span>
                  <span className="text-sm text-muted-foreground font-body">
                    AI Magic Happens
                  </span>
                </div>
              </div>
            </button>

            <button
              onClick={() => setOpenFeature("experience")}
              className="group gallery-card p-8 hover:shadow-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left bg-card hover:bg-card/80"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <ShoppingBag className="w-12 h-12 text-accent relative z-10" />
                </div>
                <div className="space-y-2 text-center">
                  <span className="font-accent text-xl text-foreground block font-semibold">
                    EXPERIENCE
                  </span>
                  <span className="text-sm text-muted-foreground font-body">
                    Try Any Outfit
                  </span>
                </div>
              </div>
            </button>
          </div>
          
          {/* Elegant tagline */}
          <p className="font-accent text-sm text-muted-foreground tracking-wide pt-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            WHERE ART MEETS INNOVATION
          </p>
        </div>
      </div>
      
      {/* Soft spotlight effect */}
      <div className="spotlight absolute inset-0 pointer-events-none z-5" />

      {/* Feature Modals */}
      {openFeature && (
        <FeatureModal
          open={openFeature !== null}
          onOpenChange={(open) => !open && setOpenFeature(null)}
          title={featureContent[openFeature].title}
          description={featureContent[openFeature].description}
          content={featureContent[openFeature].content}
          onStartClick={scrollToCapture}
        />
      )}
    </section>
  );
};
