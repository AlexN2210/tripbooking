import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Award, TrendingUp, Calendar } from 'lucide-react';
import { supabase, TripWithDestinations } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { TripComparisonCard } from './TripComparisonCard';
import { PalmLoader } from '../ui/Loaders';

interface TripComparisonProps {
  onBack: () => void;
}

interface TripComparison extends TripWithDestinations {
  monthlyAmount: number;
  monthsToTarget: number;
  score: number;
}

export const TripComparison = ({ onBack }: TripComparisonProps) => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);

  const loadTrips = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const { data: tripsData, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (tripsError) {
      console.error('Error loading trips:', tripsError);
      setLoading(false);
      return;
    }

    const tripsWithDestinations = await Promise.all(
      tripsData.map(async (trip) => {
        const { data: destinations } = await supabase
          .from('trip_destinations')
          .select('*')
          .eq('trip_id', trip.id)
          .order('order_index');

        const totalCost = trip.flight_cost + trip.accommodation_cost + trip.additional_expenses;

        let monthlyAmount = 0;
        let monthsToTarget = 0;

        const fundingDeadline = trip.start_date || trip.target_date;
        if (fundingDeadline) {
          const today = new Date();
          const target = new Date(fundingDeadline);
          const diffTime = target.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          monthsToTarget = Math.max(1, Math.ceil(diffDays / 30));
          monthlyAmount = totalCost / monthsToTarget;
        }

        const score = calculateScore(totalCost, monthlyAmount, monthsToTarget);

        return {
          ...trip,
          destinations: destinations || [],
          monthlyAmount,
          monthsToTarget,
          score
        };
      })
    );

    setTrips(tripsWithDestinations);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const calculateScore = (totalCost: number, monthlyAmount: number, monthsToTarget: number): number => {
    let score = 100;

    if (monthlyAmount > 1000) score -= 30;
    else if (monthlyAmount > 500) score -= 15;

    if (totalCost > 5000) score -= 20;
    else if (totalCost > 3000) score -= 10;

    if (monthsToTarget < 3) score -= 20;
    else if (monthsToTarget < 6) score -= 10;
    else if (monthsToTarget > 12) score += 10;

    return Math.max(0, Math.min(100, score));
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce voyage ?')) return;

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId);

    if (!error) {
      setTrips(trips.filter(t => t.id !== tripId));
      setSelectedTrips(selectedTrips.filter(id => id !== tripId));
    }
  };

  const toggleTripSelection = (tripId: string) => {
    setSelectedTrips(prev =>
      prev.includes(tripId)
        ? prev.filter(id => id !== tripId)
        : [...prev, tripId]
    );
  };

  const selectedTripsData = trips
    .filter(t => selectedTrips.includes(t.id))
    .sort((a, b) => b.score - a.score);

  const bestTrip = selectedTripsData.length > 0 ? selectedTripsData[0] : null;

  if (loading) {
    return (
      <div className="animate-fadeIn flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="mx-auto mb-4">
            <PalmLoader label="Chargement de vos voyages..." />
          </div>
          <p className="text-gray-700">Chargement de vos voyages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeUp">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
        Retour au tableau de bord
      </button>

      <div className="surface p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-palm-700 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Comparaison de voyages</h2>
              <p className="text-gray-600 text-sm">Trouvez le voyage le plus réalisable</p>
            </div>
          </div>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun voyage sauvegardé</h3>
            <p className="text-gray-600 mb-6">
              Créez des estimations de voyage pour pouvoir les comparer
            </p>
            <button
              onClick={onBack}
              className="bg-palm-700 hover:bg-palm-800 text-white font-semibold px-6 py-3 rounded-lg transition-all"
            >
              Créer un voyage
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                Sélectionnez les voyages à comparer ({selectedTrips.length} sélectionné{selectedTrips.length > 1 ? 's' : ''})
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trips.map((trip) => {
                  const totalCost = trip.flight_cost + trip.accommodation_cost + trip.additional_expenses;
                  const isSelected = selectedTrips.includes(trip.id);

                  return (
                    <div
                      key={trip.id}
                      className={`relative bg-white rounded-xl p-4 border-2 transition-all cursor-pointer hover:shadow-md ${
                        isSelected
                          ? 'border-palm-500 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleTripSelection(trip.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{trip.name}</h3>
                          <p className="text-sm text-gray-600">
                            {trip.destinations.map(d => d.city).join(', ')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(trip.id);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Coût total</span>
                          <span className="font-semibold text-gray-900">{totalCost.toFixed(2)} €</span>
                        </div>
                        {(trip.start_date || trip.target_date) && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Par mois</span>
                              <span className="font-semibold text-gray-900">{trip.monthlyAmount.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Durée</span>
                              <span className="font-semibold text-gray-900">{trip.monthsToTarget} mois</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Score de faisabilité</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  trip.score >= 70 ? 'bg-palm-600' :
                                  trip.score >= 40 ? 'bg-sand-400' : 'bg-red-500'
                                }`}
                                style={{ width: `${trip.score}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-semibold text-gray-900">{trip.score}/100</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedTripsData.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-gray-200">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Résultats de la comparaison</h3>

                  {bestTrip && (
                    <div className="bg-gradient-to-br from-palm-50 to-sand-50 rounded-xl p-6 border-2 border-palm-200 mb-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-palm-700 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-lg font-bold text-palm-900">Meilleur choix</h4>
                            <span className="px-3 py-1 bg-palm-700 text-white text-xs font-semibold rounded-full">
                              Score: {bestTrip.score}/100
                            </span>
                          </div>
                          <p className="text-palm-900 font-semibold text-xl mb-2">{bestTrip.name}</p>
                          <p className="text-palm-800 text-sm mb-3">
                            {bestTrip.destinations.map(d => `${d.city}, ${d.country}`).join(' → ')}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <p className="text-xs text-palm-700 mb-1">Coût total</p>
                              <p className="font-bold text-palm-900">
                                {(bestTrip.flight_cost + bestTrip.accommodation_cost + bestTrip.additional_expenses).toFixed(2)} €
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-palm-700 mb-1">Par mois</p>
                              <p className="font-bold text-palm-900">{bestTrip.monthlyAmount.toFixed(2)} €</p>
                            </div>
                            <div>
                              <p className="text-xs text-palm-700 mb-1">Durée</p>
                              <p className="font-bold text-palm-900">{bestTrip.monthsToTarget} mois</p>
                            </div>
                            <div>
                              <p className="text-xs text-palm-700 mb-1">Départ</p>
                              <p className="font-bold text-palm-900">
                                {bestTrip.start_date
                                  ? new Date(bestTrip.start_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                                  : bestTrip.target_date
                                    ? new Date(bestTrip.target_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                                    : 'Non défini'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {selectedTripsData.map((trip, index) => (
                      <TripComparisonCard
                        key={trip.id}
                        trip={trip}
                        rank={index + 1}
                        isBest={index === 0}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 pt-4">
                  <div className="bg-sand-50 rounded-xl p-4 border border-sand-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-sand-800" />
                      <p className="text-sm font-medium text-sand-800">Le plus économique</p>
                    </div>
                    <p className="text-xl font-bold text-sand-900">
                      {selectedTripsData.reduce((min, trip) => {
                        const totalCost = trip.flight_cost + trip.accommodation_cost + trip.additional_expenses;
                        return totalCost < min.cost ? { name: trip.name, cost: totalCost } : min;
                      }, { name: '', cost: Infinity }).name}
                    </p>
                  </div>

                  <div className="bg-palm-50 rounded-xl p-4 border border-palm-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-5 h-5 text-palm-800" />
                      <p className="text-sm font-medium text-palm-800">Le plus rapide</p>
                    </div>
                    <p className="text-xl font-bold text-palm-900">
                      {selectedTripsData.filter(t => t.monthsToTarget > 0).reduce((min, trip) =>
                        trip.monthsToTarget < min.months ? { name: trip.name, months: trip.monthsToTarget } : min
                      , { name: 'Aucun', months: Infinity }).name}
                    </p>
                  </div>

                  <div className="bg-sand-50 rounded-xl p-4 border border-sand-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Award className="w-5 h-5 text-palm-800" />
                      <p className="text-sm font-medium text-palm-800">Meilleur score</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedTripsData[0]?.name || 'Aucun'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
