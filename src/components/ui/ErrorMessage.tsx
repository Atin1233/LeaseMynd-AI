import { AlertCircle, RefreshCw, X } from "lucide-react";
import { useState } from "react";

interface ErrorMessageProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  variant?: "error" | "warning" | "info";
}

export function ErrorMessage({
  title,
  message,
  action,
  dismissible = false,
  onDismiss,
  variant = "error",
}: ErrorMessageProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const variantStyles = {
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "text-red-600",
      title: "text-red-800",
      text: "text-red-700",
      button: "bg-red-100 text-red-700 hover:bg-red-200",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "text-amber-600",
      title: "text-amber-800",
      text: "text-amber-700",
      button: "bg-amber-100 text-amber-700 hover:bg-amber-200",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
      title: "text-blue-800",
      text: "text-blue-700",
      button: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    },
  };

  const styles = variantStyles[variant];

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={`${styles.bg} ${styles.border} border p-4 flex items-start gap-3 transition-opacity duration-200`}
    >
      <AlertCircle className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`font-medium ${styles.title} mb-1`}>{title}</h4>
        )}
        <p className={`text-sm ${styles.text}`}>{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium ${styles.button} transition-colors`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {action.label}
          </button>
        )}
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className={`p-1 ${styles.text} hover:opacity-70 transition-opacity flex-shrink-0`}
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
