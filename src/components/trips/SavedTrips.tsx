import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { WaveLoader } from '../ui/Loaders';

type SavedTripsProps = {
  onBack: () => void;
  onEditTrip: (tripId: string) => void;
};

type TripRow = {
  id: string;
  name: string;
  created_at: string;
  passengers: number;
  flight_cost: number;
  accommodation_cost: number;
  additional_expenses: number;
  start_date: string | null;
  end_date: string | null;
  target_date: string | null;
  funding_months_est: number | null;
  monthly_saving_total: number | null;
  trip_destinations?: { id: string; city: string; country: string; order_index: number }[];
};

const EUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function SavedTrips({ onBack, onEditTrip }: SavedTripsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trips, setTrips] = useState<TripRow[]>([]);

  const loadTrips = useCallback(async () => {
    if (!user) {
      setTrips([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('trips')
        .select(
          `
            id,
            name,
            created_at,
            passengers,
            flight_cost,
            accommodation_cost,
            additional_expenses,
            start_date,
            end_date,
            target_date,
            funding_months_est,
            monthly_saving_total,
            trip_destinations (
              id,
              city,
              country,
              order_index
            )
          `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (qErr) throw qErr;
      setTrips((data as TripRow[]) ?? []);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger vos voyages sauvegardés.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const cards = useMemo(() => {
    return trips.map((t) => {
      const destinations = [...(t.trip_destinations ?? [])].sort((a, b) => a.order_index - b.order_index);
      const cities = destinations.map((d) => d.city).filter(Boolean);
      const total = (t.flight_cost ?? 0) + (t.accommodation_cost ?? 0) + (t.additional_expenses ?? 0);
      return { t, cities, total };
    });
  }, [trips]);

  const handleDelete = async (tripId: string) => {
    if (!user) return;
    if (!window.confirm('Supprimer ce voyage ?')) return;

    setDeletingId(tripId);
    setError(null);
    try {
      const { error: delErr } = await supabase.from('trips').delete().eq('id', tripId).eq('user_id', user.id);
      if (delErr) throw delErr;
      await loadTrips();
    } catch (e) {
      console.error(e);
      setError("Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-fadeUp space-y-6">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
        Retour à l’accueil
      </button>

      <div className="surface p-6 sm:p-8 animate-slideUp">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Voyages sauvegardés</h2>
            <p className="text-gray-600 text-sm">
              Éditez vos voyages existants ou supprimez ceux dont vous n’avez plus besoin.
            </p>
          </div>
          <button onClick={loadTrips} className="sandbar-btn">
            Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="surface p-6">
            <div className="flex items-center gap-3">
              <WaveLoader label="Chargement" />
              <p className="text-sm font-semibold text-gray-800">Chargement de vos voyages…</p>
            </div>
          </div>
        ) : cards.length === 0 ? (
          <div className="surface p-6">
            <p className="text-sm text-gray-700">
              Aucun voyage sauvegardé pour le moment.
            </p>
          </div>
        ) : (
          cards.map(({ t, cities, total }) => (
            <div key={t.id} className="surface p-6 overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-600">
                    {new Date(t.created_at).toLocaleDateString('fr-FR')}
                  </p>
                  <h3 className="text-lg font-extrabold text-gray-900 truncate">{t.name}</h3>
                  <p className="text-sm text-gray-700 truncate">
                    {cities.length ? cities.join(' → ') : '—'}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditTrip(t.id)}
                    className="px-3 py-2 rounded-full border border-white/55 bg-white/60 hover:bg-white/80 text-gray-900 text-xs font-semibold transition-all inline-flex items-center gap-2"
                    title="Éditer"
                  >
                    <Pencil className="w-4 h-4" />
                    Éditer
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    className="px-3 py-2 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-all inline-flex items-center gap-2 disabled:opacity-60"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deletingId === t.id ? 'Suppression…' : 'Supprimer'}
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-white/60 rounded-xl border border-white/40 p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Coût total</p>
                  <p className="text-lg font-extrabold text-gray-900">{EUR.format(total)}</p>
                </div>
                <div className="bg-sand-50 rounded-xl border border-sand-200 p-4">
                  <p className="text-xs font-semibold text-sand-800 mb-1">Financement</p>
                  <p className="text-sm font-bold text-sand-900">
                    {t.funding_months_est ? `${t.funding_months_est} mois` : '—'}
                  </p>
                  <p className="text-xs text-sand-800">
                    {t.monthly_saving_total ? `~${EUR.format(t.monthly_saving_total)}/mois` : ''}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

