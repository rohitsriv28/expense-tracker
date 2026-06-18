import { createContext, useContext } from "react";
import { type AlertModalProps } from "../components/ui/AlertModal";

export type ShowAlertOptions = Omit<AlertModalProps, "isOpen" | "onClose">;

export interface AlertContextType {
  showAlert: (options: ShowAlertOptions) => void;
  hideAlert: () => void;
}

export const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
