import { Calendar, TrendingUp, Clock } from 'lucide-react';

interface SavingsCalculatorProps {
  totalCost: number;
  targetDate: string;
}

export const SavingsCalculator = ({ totalCost, targetDate }: SavingsCalculatorProps) => {
  const today = new Date();
  const target = new Date(targetDate);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.max(1, Math.ceil(diffDays / 30));

  if (diffDays < 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-600 font-medium">
          La date cible est dans le passé. Veuillez choisir une date future.
        </p>
      </div>
    );
  }

  const monthlyAmount = totalCost / diffMonths;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Plan d'épargne</h3>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-sand-50 to-sand-100 rounded-xl p-4 border border-sand-200">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-sand-800" />
            <p className="text-sm font-medium text-sand-800">Par mois</p>
          </div>
          <p className="text-3xl font-bold text-sand-900">{monthlyAmount.toFixed(2)} €</p>
          <p className="text-xs text-sand-800 mt-1">à économiser mensuellement</p>
        </div>

        <div className="bg-gradient-to-br from-palm-50 to-palm-100 rounded-xl p-4 border border-palm-200">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-5 h-5 text-palm-800" />
            <p className="text-sm font-medium text-palm-800">Durée</p>
          </div>
          <p className="text-3xl font-bold text-palm-900">{diffMonths}</p>
          <p className="text-xs text-palm-800 mt-1">mois restants ({diffDays} jours)</p>
        </div>

        <div className="bg-gradient-to-br from-sand-50 to-palm-50 rounded-xl p-4 border border-sand-200">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-5 h-5 text-palm-800" />
            <p className="text-sm font-medium text-palm-800">Date cible</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {new Date(targetDate).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-palm-800 to-palm-700 rounded-xl p-6 text-white">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold mb-1">Stratégie d'épargne recommandée</h4>
            <p className="text-white/90 text-sm leading-relaxed">
              Pour atteindre votre objectif de <strong>{totalCost.toFixed(2)} €</strong> d'ici le{' '}
              <strong>{new Date(targetDate).toLocaleDateString('fr-FR')}</strong>, mettez de côté{' '}
              <strong>{monthlyAmount.toFixed(2)} €</strong> chaque mois. Configurez un virement automatique pour ne jamais oublier.
            </p>
          </div>
        </div>
      </div>

      <div className="relative pt-2">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block text-gray-600">
              Progression de l'épargne
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-palm-700">
              0%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-4 text-xs flex rounded-full bg-gray-200">
          <div
            style={{ width: '0%' }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-sand-400 to-palm-600 transition-all duration-500"
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Commencez à épargner dès aujourd'hui pour voir votre progression
        </p>
      </div>
    </div>
  );
};
