import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { WaveLoader } from '../ui/Loaders';

interface ResetPasswordFormProps {
  onBack: () => void;
}

export const ResetPasswordForm = ({ onBack }: ResetPasswordFormProps) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await resetPassword(email);

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
        <div className="surface p-8 border border-gray-100 text-center animate-fadeUp">
          <div className="w-16 h-16 bg-palm-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-palm-700" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email envoyé</h2>
          <p className="text-gray-600 mb-6">
            Vérifiez votre boîte mail pour réinitialiser votre mot de passe.
          </p>
          <button
            onClick={onBack}
            className="w-full btn-palm py-3"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="surface p-8 animate-fadeUp">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </button>

        <h2 className="text-3xl font-bold text-gray-900 mb-2">Mot de passe oublié</h2>
        <p className="text-gray-600 mb-8">
          Entrez votre email pour recevoir un lien de réinitialisation
        </p>

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
              <WaveLoader label="Envoi en cours" />
            ) : (
              'Envoyer le lien'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
