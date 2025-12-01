import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

export function LoadingScreen({ 
  message = "Cargando...", 
  showRetryButton = false,
  onRetry 
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-600">{message}</p>
        {showRetryButton && onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

