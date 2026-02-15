import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { WaveLoader } from '../ui/Loaders';

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onSwitchToReset: () => void;
}

export const LoginForm = ({ onSwitchToSignup, onSwitchToReset }: LoginFormProps) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="surface p-8 animate-fadeUp">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenue</h2>
        <p className="text-gray-600 mb-8">Connectez-vous à votre compte</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-palm-500 focus:ring-2 focus:ring-palm-500 focus:ring-opacity-20 outline-none transition-all"
                placeholder="votre@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-palm-500 focus:ring-2 focus:ring-palm-500 focus:ring-opacity-20 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-palm py-3 flex items-center justify-center"
          >
            {loading ? (
              <WaveLoader label="Connexion en cours" />
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={onSwitchToReset}
            className="text-sm link-palm"
          >
            Mot de passe oublié ?
          </button>
          <div className="text-sm text-gray-600">
            Pas encore de compte ?{' '}
            <button
              onClick={onSwitchToSignup}
              className="link-palm"
            >
              Créer un compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
