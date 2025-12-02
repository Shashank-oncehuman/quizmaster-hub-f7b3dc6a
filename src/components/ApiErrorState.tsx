import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ApiErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ApiErrorState = ({ 
  title = "Failed to load data", 
  message = "There was an error fetching the data. Please try again.",
  onRetry 
}: ApiErrorStateProps) => {
  return (
    <Alert variant="destructive" className="my-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export const EmptyState = ({ message = "No data found" }: { message?: string }) => {
  return (
    <div className="text-center py-12 border border-dashed rounded-lg">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
};
