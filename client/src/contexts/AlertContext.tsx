import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import AlertModal, { type AlertModalProps } from "../components/ui/AlertModal";

type ShowAlertOptions = Omit<AlertModalProps, "isOpen" | "onClose">;

interface AlertContextType {
  showAlert: (options: ShowAlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertOptions, setAlertOptions] = useState<ShowAlertOptions | null>(null);

  const hideAlert = useCallback(() => {
    setAlertOptions(null);
  }, []);

  const showAlert = useCallback((options: ShowAlertOptions) => {
    setAlertOptions(options);
  }, []);

  // Wrap button click handlers to automatically hide the alert, unless otherwise specified by the consumer
  // Actually, sometimes the consumer wants to navigate and then hide, so we can just let the consumer call hideAlert?
  // No, `primaryAction.onClick` is a callback. If we auto-hide, it's easier.
  // We'll wrap them here.
  const handlePrimaryClick = () => {
    if (alertOptions?.primaryAction?.onClick) {
      alertOptions.primaryAction.onClick();
    }
    hideAlert();
  };

  const handleSecondaryClick = () => {
    if (alertOptions?.secondaryAction?.onClick) {
      alertOptions.secondaryAction.onClick();
    }
    hideAlert();
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alertOptions && (
        <AlertModal
          isOpen={true}
          onClose={hideAlert}
          title={alertOptions.title}
          message={alertOptions.message}
          icon={alertOptions.icon}
          primaryAction={
            alertOptions.primaryAction
              ? { ...alertOptions.primaryAction, onClick: handlePrimaryClick }
              : undefined
          }
          secondaryAction={
            alertOptions.secondaryAction
              ? { ...alertOptions.secondaryAction, onClick: handleSecondaryClick }
              : undefined
          }
        />
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
