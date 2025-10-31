import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const updateNavHeight = () => {
      if (navRef.current) {
        const height = navRef.current.offsetHeight;
        document.documentElement.style.setProperty('--nav-height', `${height}px`);
      }
    };

    updateNavHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateNavHeight();
    });

    if (navRef.current) {
      resizeObserver.observe(navRef.current);
    }

    window.addEventListener('resize', updateNavHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateNavHeight);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const scrollToSection = (sectionId: string) => {
    const targetId = sectionId === 'features' ? 'features-section' : sectionId;
    const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 96;
    
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navHeight;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 100);
    } else {
      const element = document.getElementById(targetId);
      if (element) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navHeight;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <nav
      ref={navRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-card/95 backdrop-blur-md border-b border-border shadow-card"
          : "bg-background/80 backdrop-blur-sm"
      )}
    >
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="font-accent text-2xl text-foreground tracking-wide hover:text-primary transition-colors group"
        >
          <span className="relative">
            PIXEL PARADE
            <div className="absolute -bottom-1 left-0 w-0 h-[3px] bg-primary rounded-full group-hover:w-full transition-all duration-300" />
          </span>
        </button>

        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-6">
            {session ? (
              <>
                <button
                  onClick={() => navigate("/capture")}
                  className="font-accent text-sm tracking-wide text-muted-foreground hover:text-primary transition-colors relative group"
                >
                  CAPTURE
                  <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary rounded-full group-hover:w-full transition-all duration-300" />
                </button>
                <button
                  onClick={() => navigate("/my-avatars")}
                  className="font-accent text-sm tracking-wide text-muted-foreground hover:text-primary transition-colors relative group"
                >
                  MY AVATARS
                  <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary rounded-full group-hover:w-full transition-all duration-300" />
                </button>
                <button
                  onClick={() => navigate("/my-wardrobe")}
                  className="font-accent text-sm tracking-wide text-muted-foreground hover:text-primary transition-colors relative group"
                >
                  WARDROBE
                  <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary rounded-full group-hover:w-full transition-all duration-300" />
                </button>
                <button
                  onClick={() => navigate("/favorites")}
                  className="font-accent text-sm tracking-wide text-muted-foreground hover:text-primary transition-colors relative group"
                >
                  FAVORITES
                  <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary rounded-full group-hover:w-full transition-all duration-300" />
                </button>
              </>
            ) : (
              <button
                onClick={() => scrollToSection("features")}
                className="font-accent text-sm tracking-wide text-muted-foreground hover:text-primary transition-colors relative group"
              >
                FEATURES
                <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary rounded-full group-hover:w-full transition-all duration-300" />
              </button>
            )}
          </nav>

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              variant="kusama"
              size="sm"
              className="font-accent tracking-wider"
            >
              GET STARTED
            </Button>
          )}
        </div>
      </div>

      {isScrolled && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-1">
          <div className="w-1 h-1 rounded-full bg-primary opacity-50" />
          <div className="w-1 h-1 rounded-full bg-secondary opacity-50" />
          <div className="w-1 h-1 rounded-full bg-accent opacity-50" />
        </div>
      )}
    </nav>
  );
};
