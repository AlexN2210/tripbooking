import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { Dashboard } from './components/Dashboard';
import { PalmLoader } from './components/ui/Loaders';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-aurora relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 ui-grid opacity-60 pointer-events-none"></div>
        <div className="text-center">
          <div className="mx-auto mb-4">
            <PalmLoader label="Chargement..." />
          </div>
          <p className="text-gray-700 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
