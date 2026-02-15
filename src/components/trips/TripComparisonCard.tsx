import { Plane, Hotel, Wallet, Calendar, TrendingUp, Users } from 'lucide-react';

interface TripComparisonCardProps {
  trip: {
    name: string;
    destinations: Array<{ city: string; country: string }>;
    flight_cost: number;
    accommodation_cost: number;
    additional_expenses: number;
    passengers: number;
    target_date: string | null;
    monthlyAmount: number;
    monthsToTarget: number;
    score: number;
  };
  rank: number;
  isBest: boolean;
}

export const TripComparisonCard = ({ trip, rank, isBest }: TripComparisonCardProps) => {
  const totalCost = trip.flight_cost + trip.accommodation_cost + trip.additional_expenses;
  const costPerPerson = totalCost / trip.passengers;

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-sand-500';
      case 2: return 'bg-stone-400';
      case 3: return 'bg-palm-700';
      default: return 'bg-gray-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-palm-800 bg-palm-50 border-palm-200';
    if (score >= 40) return 'text-sand-900 bg-sand-50 border-sand-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className={`surface-soft rounded-xl p-6 border-2 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
      isBest ? 'border-palm-300' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`w-8 h-8 ${getRankColor(rank)} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-bold text-sm">#{rank}</span>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-gray-900 mb-1">{trip.name}</h4>
            <p className="text-sm text-gray-600">
              {trip.destinations.map(d => `${d.city}, ${d.country}`).join(' → ')}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full border ${getScoreColor(trip.score)}`}>
          <span className="text-sm font-bold">{trip.score}/100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="flex items-center space-x-1 text-gray-600 mb-1">
            <Plane className="w-4 h-4" />
            <span className="text-xs">Vol</span>
          </div>
          <p className="font-semibold text-gray-900">{trip.flight_cost.toFixed(2)} €</p>
        </div>

        <div>
          <div className="flex items-center space-x-1 text-gray-600 mb-1">
            <Hotel className="w-4 h-4" />
            <span className="text-xs">Hébergement</span>
          </div>
          <p className="font-semibold text-gray-900">{trip.accommodation_cost.toFixed(2)} €</p>
        </div>

        <div>
          <div className="flex items-center space-x-1 text-gray-600 mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-xs">Autres</span>
          </div>
          <p className="font-semibold text-gray-900">{trip.additional_expenses.toFixed(2)} €</p>
        </div>

        <div>
          <div className="flex items-center space-x-1 text-gray-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">Par personne</span>
          </div>
          <p className="font-semibold text-gray-900">{costPerPerson.toFixed(2)} €</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-1 text-gray-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Épargne mensuelle</span>
            </div>
            <p className="font-bold text-palm-700">{trip.monthlyAmount.toFixed(2)} €/mois</p>
          </div>

          {trip.target_date && (
            <div>
              <div className="flex items-center space-x-1 text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Date cible</span>
              </div>
              <p className="font-bold text-gray-900">
                {new Date(trip.target_date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-600 mb-1">Coût total</p>
          <p className="text-2xl font-bold text-gray-900">{totalCost.toFixed(2)} €</p>
        </div>
      </div>
    </div>
  );
};
