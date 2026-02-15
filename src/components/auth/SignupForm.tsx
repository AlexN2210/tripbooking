import { useState } from 'react';
import { Mail, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { WaveLoader } from '../ui/Loaders';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export const SignupForm = ({ onSwitchToLogin }: SignupFormProps) => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="surface p-8 text-center animate-fadeUp">
          <div className="w-16 h-16 bg-palm-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-palm-700" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Compte créé</h2>
          <p className="text-gray-600 mb-6">
            Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.
          </p>
          <button
            onClick={onSwitchToLogin}
            className="w-full btn-palm py-3"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="surface p-8 animate-fadeUp">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h2>
        <p className="text-gray-600 mb-8">Commencez à planifier vos voyages</p>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              <WaveLoader label="Inscription en cours" />
            ) : (
              "S'inscrire"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600">
            Déjà un compte ?{' '}
            <button
              onClick={onSwitchToLogin}
              className="link-palm"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
