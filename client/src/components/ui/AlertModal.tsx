import React from "react";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Target,
} from "lucide-react";

export interface AlertAction {
  label: string;
  onClick: () => void;
  className?: string; // Optional custom Tailwind classes for the button
}

export interface AlertModalProps {
  isOpen: boolean;
  title: React.ReactNode;
  message: React.ReactNode;
  icon?: "success" | "warning" | "error" | "info" | "target" | React.ReactNode;
  primaryAction?: AlertAction;
  secondaryAction?: AlertAction;
  onClose: () => void;
}

export default function AlertModal({
  isOpen,
  title,
  message,
  icon = "info",
  primaryAction,
  secondaryAction,
  onClose,
}: AlertModalProps) {
  if (!isOpen) return null;

  const renderIcon = () => {
    if (React.isValidElement(icon)) return icon;

    const size = "h-8 w-8";
    switch (icon) {
      case "success":
        return <CheckCircle className={`${size} text-green-500`} />;
      case "warning":
        return <AlertTriangle className={`${size} text-yellow-500`} />;
      case "error":
        return <XCircle className={`${size} text-red-500`} />;
      case "target":
        return <Target className={`${size} text-[var(--text-brand)]`} />;
      case "info":
      default:
        return <Info className={`${size} text-blue-500`} />;
    }
  };

  const getIconBackground = () => {
    if (React.isValidElement(icon)) return "bg-[var(--status-neutral-bg)]";

    switch (icon) {
      case "success":
        return "bg-green-500/10";
      case "warning":
        return "bg-yellow-500/10";
      case "error":
        return "bg-red-500/10";
      case "target":
        return "bg-[var(--interactive-primary-subtle)]";
      case "info":
      default:
        return "bg-blue-500/10";
    }
  };

  return (
    <div
      className="bottom-sheet-backdrop md:flex md:items-center md:justify-center md:p-4 z-50"
      onClick={onClose}
    >
      <div
        className="card max-w-sm w-full mx-auto shadow-2xl relative overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center p-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${getIconBackground()}`}
          >
            {renderIcon()}
          </div>
          <h2 className="text-xl font-bold mb-2">{title}</h2>
          <div
            className="text-sm mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            {message}
          </div>

          <div className="flex flex-col gap-3">
            {primaryAction && (
              <button
                type="button"
                className={`btn btn-primary w-full ${primaryAction.className || ""}`}
                onClick={primaryAction.onClick}
              >
                {primaryAction.label}
              </button>
            )}

            {secondaryAction ? (
              <button
                type="button"
                className={`btn border border-[var(--border-default)] w-full font-semibold ${secondaryAction.className || ""}`}
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </button>
            ) : (
              !primaryAction && (
                <button
                  type="button"
                  className="btn border border-[var(--border-default)] w-full font-semibold"
                  onClick={onClose}
                >
                  Close
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
