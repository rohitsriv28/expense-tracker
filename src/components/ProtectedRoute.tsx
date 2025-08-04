import { Navigate } from "react-router-dom";
import { useAuth } from "../services/authService";
import type { ReactElement } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: ReactElement;
}) {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
