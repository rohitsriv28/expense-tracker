import { BrowserRouter, Routes, Route } from "react-router-dom";
import InstallPrompt from "./components/InstallPrompt";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import useOfflineStatus from "./hooks/useOfflineStatus";
import Login from "./pages/Login";

function App() {
  const isOffline = useOfflineStatus();

  return (
    <div className="min-h-screen bg-gray-100">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>

      {isOffline && (
        <div className="fixed bottom-0 left-0 right-0 bg-yellow-500 text-white p-2 text-center">
          Offline Mode - Changes will sync when online
        </div>
      )}
      <InstallPrompt />
    </div>
  );
}

export default App;
