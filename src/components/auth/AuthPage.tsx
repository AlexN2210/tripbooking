import { useEffect, useRef, useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import { Plane } from 'lucide-react';

type AuthView = 'login' | 'signup' | 'reset';

export const AuthPage = () => {
  const [view, setView] = useState<AuthView>('login');
  const [transition, setTransition] = useState<'animate-slideRight' | 'animate-slideLeft'>('animate-slideRight');
  const prevViewRef = useRef<AuthView>('login');

  useEffect(() => {
    const order: Record<AuthView, number> = { login: 0, signup: 1, reset: 2 };
    const prev = prevViewRef.current;
    setTransition(order[view] >= order[prev] ? 'animate-slideLeft' : 'animate-slideRight');
    prevViewRef.current = view;
  }, [view]);

  return (
    <div className="min-h-screen bg-aurora relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 ui-grid opacity-60 pointer-events-none"></div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-sand-200 to-sand-300 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-floatSlow animate-shimmer"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-br from-sand-200 to-palm-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-floatSlow animate-shimmer" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-br from-palm-200 to-sand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-floatSlow animate-shimmer" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-palm-700 rounded-2xl mb-4 ring-1 ring-white/30 transform hover:scale-110 transition-transform animate-slideUp glow-palm">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold mb-2 headline">TravelBudget</h1>
          <p className="text-gray-700">Planifiez vos voyages en toute sérénité</p>
        </div>

        <div key={view} className={transition}>
          {view === 'login' && (
            <LoginForm
              onSwitchToSignup={() => setView('signup')}
              onSwitchToReset={() => setView('reset')}
            />
          )}

          {view === 'signup' && (
            <SignupForm onSwitchToLogin={() => setView('login')} />
          )}

          {view === 'reset' && (
            <ResetPasswordForm onBack={() => setView('login')} />
          )}
        </div>
      </div>
    </div>
  );
};
