import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calculator, GitCompare, LogOut, Plane } from 'lucide-react';
import { TripEstimation } from './trips/TripEstimation';
import { TripComparison } from './trips/TripComparison';

type View = 'home' | 'estimation' | 'comparison';

export const Dashboard = () => {
  const { signOut } = useAuth();
  const [view, setView] = useState<View>('home');
  const [transition, setTransition] = useState<'animate-slideRight' | 'animate-slideLeft'>('animate-slideRight');
  const prevViewRef = useRef<View>('home');

  useEffect(() => {
    const order: Record<View, number> = { home: 0, estimation: 1, comparison: 2 };
    const prev = prevViewRef.current;
    setTransition(order[view] >= order[prev] ? 'animate-slideLeft' : 'animate-slideRight');
    prevViewRef.current = view;
  }, [view]);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-aurora relative overflow-hidden">
      <div className="absolute inset-0 ui-grid opacity-60 pointer-events-none"></div>
      <div className="sticky top-0 z-50 pt-3 pb-3">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="sandbar-header">
            <svg
              className="sandbar-header__svg"
              viewBox="0 0 1200 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="sandBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FFFBF2" />
                  <stop offset="0.55" stopColor="#FFF3D6" />
                  <stop offset="1" stopColor="#FFE5AD" />
                </linearGradient>
                <linearGradient id="sandWarm" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#E6A83C" stopOpacity="0.34" />
                  <stop offset="0.55" stopColor="#F5BC57" stopOpacity="0.28" />
                  <stop offset="1" stopColor="#26A56F" stopOpacity="0.14" />
                </linearGradient>
                <linearGradient id="shore" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#E6A83C" />
                  <stop offset="0.55" stopColor="#26A56F" />
                  <stop offset="1" stopColor="#2FC5FF" />
                </linearGradient>
                <filter id="sandGrain" x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
                  <feColorMatrix type="matrix" values="
                    0 0 0 0 0.63
                    0 0 0 0 0.43
                    0 0 0 0 0.15
                    0 0 0 0.10 0" />
                </filter>
              </defs>

              {/* sandbar shape (wavy bottom edge) */}
              <path
                d="M0,0 H1200 V72
                   C1080,96 940,88 820,78
                   C700,68 620,92 500,86
                   C380,80 310,64 190,72
                   C110,78 56,88 0,78
                   Z"
                fill="url(#sandBase)"
              />

              {/* warm sheen drifting on sand */}
              <path
                className="sandbar-header__sheen"
                d="M-240,10 C-30,0 120,18 320,18 C520,18 670,0 920,10 C1060,16 1160,22 1440,18 L1440,62 C1160,72 1060,66 920,62 C670,56 520,72 320,64 C120,58 -30,72 -240,64 Z"
                fill="url(#sandWarm)"
              />

              {/* subtle grain */}
              <rect x="0" y="0" width="1200" height="100" filter="url(#sandGrain)" opacity="0.35" />

              {/* shoreline animated */}
              <path
                className="sandbar-header__shoreline"
                d="M0,76
                   C60,86 120,92 190,86
                   C280,78 340,68 500,90
                   C640,108 730,70 820,80
                   C940,94 1070,100 1200,78"
                fill="none"
                stroke="url(#shore)"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.8"
              />
            </svg>

            <div className="sandbar-header__content">
              <button
                onClick={() => setView('home')}
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 bg-palm-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform glow-palm">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-extrabold tracking-tight brand-text">
                  TravelBudget
                </span>
              </button>

              <button
                onClick={handleSignOut}
                className="sandbar-btn"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </header>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div key={view} className={transition}>
          {view === 'home' && (
            <div className="space-y-8">
              <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 headline">
                  Planifiez votre prochain voyage
                </h1>
                <p className="text-lg muted max-w-2xl mx-auto">
                  Estimez le coût de vos voyages, comparez plusieurs destinations et calculez combien épargner chaque mois
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <button
                  onClick={() => setView('estimation')}
                  className="group relative surface p-8 text-left transition-all transform hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sand-200 to-sand-300 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500 animate-float animate-shimmer"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-sand-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform glow-sand">
                      <Calculator className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Estimer un voyage
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      Calculez le coût total de votre voyage et découvrez combien économiser chaque mois pour le réaliser
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setView('comparison')}
                  className="group relative surface p-8 text-left transition-all transform hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-palm-100 to-sand-100 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500 animate-float animate-shimmer"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-palm-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform glow-palm">
                      <GitCompare className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Comparer des voyages
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      Comparez plusieurs destinations pour identifier celle qui correspond le mieux à votre budget
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {view === 'estimation' && (
            <TripEstimation onBack={() => setView('home')} />
          )}

          {view === 'comparison' && (
            <TripComparison onBack={() => setView('home')} />
          )}
        </div>
      </div>
    </div>
  );
};
