import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface LoaderProps {
  onComplete?: () => void;
}

const Loader = ({ onComplete }: LoaderProps) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Reduced progress duration for better performance score (Lighthouse 90+)
    const duration = 600; 
    const intervalTime = 30;
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment + Math.random() * 1.5;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
          }, 400);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  const renderContent = () => {
    const config = {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      width: "100%",
      gap: "24px",
      backgroundColor: "hsl(var(--background))",
      position: "fixed",
      top: 0,
      left: 0,
      transition: "opacity 1s ease-in-out",
      zIndex: 9999,
    } as React.CSSProperties;

    return (
      <div style={config}>
        <div className="relative h-32 w-32 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin shadow-[0_0_20px_rgba(251,191,36,0.3)]" />
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-20 w-20 object-contain animate-in fade-in zoom-in duration-700" 
          />
        </div>

        <div className="flex flex-col items-center gap-4 text-center px-6 max-w-sm">
          <h1 
            className="text-3xl font-bold tracking-[0.4em] text-primary uppercase"
            style={{ fontFamily: "'Syncopate', sans-serif" }}
          >
            Friends & Memories
          </h1>
          
          <div className="flex flex-col items-center gap-2">
            <div className="h-[2px] w-48 bg-primary/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-gold shadow-[0_0_15px_rgba(251,191,36,0.6)] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-semibold">
              {progress < 40 ? "Initializing..." : progress < 70 ? "Loading Assets..." : progress < 90 ? "Setting up celebration..." : "Almost ready!"}
            </span>
          </div>
        </div>

        {/* Floating Sparkles decoration */}
        <div className="absolute top-10 left-10 text-primary/20 animate-bounce duration-[3000ms]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="absolute bottom-10 right-10 text-primary/20 animate-bounce duration-[4000ms]">
          <Sparkles className="h-6 w-6" />
        </div>
      </div>
    );
  };

  if (!isVisible) return null;

  return renderContent();
};

export default Loader;
