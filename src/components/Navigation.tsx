import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Height of nav bar
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-primary/20 shadow-elegant"
          : "bg-transparent"
      )}
      style={{
        height: "80px",
      }}
    >
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo/Brand */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="font-accent text-2xl text-foreground tracking-wider hover:text-primary transition-colors group"
        >
          <span className="relative">
            VIRTUAL TRY-ON
            <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-300" />
          </span>
        </button>

        {/* Nav Links */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => scrollToSection("capture-section")}
            className="font-accent text-sm tracking-widest text-muted-foreground hover:text-primary transition-colors relative group"
          >
            CAPTURE
            <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-300" />
          </button>
          
          <Button
            onClick={() => scrollToSection("capture-section")}
            variant="stencil"
            size="sm"
            className="font-accent tracking-wider"
          >
            GET STARTED
          </Button>
        </div>
      </div>

      {/* Spray-paint accent line */}
      {isScrolled && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] opacity-50"
          style={{
            background: "var(--gradient-primary)",
          }}
        />
      )}
    </nav>
  );
};
