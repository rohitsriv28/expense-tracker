import { useAuth } from "../services/authService";

interface HeaderProps {
  onLogout: () => void;
  onExport: () => void;
}

export default function Header({ onLogout, onExport }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="flex justify-between items-center py-4 border-b border-gray-200">
      <div>
        <h1 className="text-xl font-bold text-gray-800">CashFlow</h1>
        {user && (
          <p className="text-sm text-gray-600">
            Welcome, {user.displayName || user.email}
          </p>
        )}
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onExport}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
        >
          Export PDF
        </button>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
