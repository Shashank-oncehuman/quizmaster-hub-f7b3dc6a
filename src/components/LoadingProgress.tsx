import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface LoadingProgressProps {
  progress?: number;
  message?: string;
  showSpinner?: boolean;
}

export const LoadingProgress = ({ 
  progress, 
  message = "Loading...", 
  showSpinner = true 
}: LoadingProgressProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="relative mb-6">
        {showSpinner && (
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-primary/20 animate-pulse" />
            <Loader2 className="w-12 h-12 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
          </div>
        )}
      </div>
      
      <h3 className="text-xl font-semibold text-foreground mb-2 animate-pulse">
        {message}
      </h3>
      
      {progress !== undefined && (
        <div className="w-64 space-y-2">
          <Progress value={progress} className="h-2 transition-all duration-500" />
          <p className="text-sm text-muted-foreground text-center">
            {Math.round(progress)}% complete
          </p>
        </div>
      )}
      
      <div className="flex gap-1 mt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
};

export const LoadingOverlay = ({ message = "Please wait..." }: { message?: string }) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
        <LoadingProgress message={message} />
      </div>
    </div>
  );
};
