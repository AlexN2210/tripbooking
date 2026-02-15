import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, X, Plane, Hotel, Wallet, Calendar, Users, Save, MapPin } from 'lucide-react';
import { TripMap } from './TripMap';
import { ExpenseGauge } from './ExpenseGauge';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { WaveLoader } from '../ui/Loaders';
import { loadGoogleMaps } from '../../lib/googleMaps';
import { FundingPlanner } from './FundingPlanner';

const EUR_FORMATTER = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2
});

function formatEur(value: number) {
  return EUR_FORMATTER.format(value);
}

function parseMoney(raw: string): number {
  // Accept "1234.56", "1 234,56", "1.234,56", "€ 1234,56" etc.
  const trimmed = raw.trim();
  if (!trimmed) return 0;

  const normalized = trimmed
    .replace(/\s/g, '')
    .replace(/€/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '') // remove thousands separators like "1.234"
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  const num = Number(normalized);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, num);
}

function toPositiveInt(raw: string, fallback: number) {
  const num = Number.parseInt(raw, 10);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return num;
}

function todayIsoDate() {
  // Local "YYYY-MM-DD" for input[type=date]
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

interface Destination {
  id: string;
  country: string;
  city: string;
  hasLodging: boolean;
  nights: string;
  pricePerNight: string;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  formatted_address: string | null;
  geocoding: 'idle' | 'loading' | 'ok' | 'error';
}

interface TripEstimationProps {
  onBack: () => void;
  tripId?: string | null;
}

export const TripEstimation = ({ onBack, tripId = null }: TripEstimationProps) => {
  const { user } = useAuth();
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [tripName, setTripName] = useState('');
  const [lodgingMode, setLodgingMode] = useState<'per_step' | 'global'>('per_step');
  const [sameCountry, setSameCountry] = useState(true);
  const [sharedCountry, setSharedCountry] = useState('');
  const [destinations, setDestinations] = useState<Destination[]>([
    {
      id: crypto.randomUUID(),
      country: '',
      city: '',
      hasLodging: true,
      nights: '',
      pricePerNight: '',
      latitude: null,
      longitude: null,
      place_id: null,
      formatted_address: null,
      geocoding: 'idle'
    }
  ]);
  const [flightCost, setFlightCost] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [accommodationCost, setAccommodationCost] = useState('');
  const [additionalExpenses, setAdditionalExpenses] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [noDatesYet, setNoDatesYet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fundingDateIso, setFundingDateIso] = useState<string | null>(null);
  const [fundingMonths, setFundingMonths] = useState<number | null>(null);
  const [monthlySavingPerPerson, setMonthlySavingPerPerson] = useState<number | null>(null);
  const [monthlySavingTotal, setMonthlySavingTotal] = useState<number | null>(null);
  const [saveFundingMessage, setSaveFundingMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    if (!user) return;

    let cancelled = false;
    const load = async () => {
      setLoadingExisting(true);
      setFormError(null);
      try {
        const { data: t, error: tErr } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .eq('user_id', user.id)
          .single();
        if (tErr) throw tErr;

        const { data: ds, error: dErr } = await supabase
          .from('trip_destinations')
          .select('*')
          .eq('trip_id', tripId)
          .order('order_index', { ascending: true });
        if (dErr) throw dErr;

        if (cancelled) return;

        setTripName(String(t.name ?? ''));
        setFlightCost(t.flight_cost != null ? String(t.flight_cost) : '');
        setPassengers(t.passengers != null ? String(t.passengers) : '1');
        setAccommodationCost(t.accommodation_cost != null ? String(t.accommodation_cost) : '');
        setAdditionalExpenses(t.additional_expenses != null ? String(t.additional_expenses) : '');
        setStartDate(t.start_date ?? t.target_date ?? '');
        setEndDate(t.end_date ?? '');
        setNoDatesYet(Boolean(!t.start_date && !t.target_date));

        setMonthlySavingPerPerson(t.monthly_saving_per_person ?? null);
        setMonthlySavingTotal(t.monthly_saving_total ?? null);
        setFundingMonths(t.funding_months_est ?? null);
        setFundingDateIso(t.funding_date_est ?? null);

        const mapped: Destination[] =
          Array.isArray(ds) && ds.length
            ? ds.map((d: Record<string, unknown>) => ({
                id: (d.id as string | undefined) ?? crypto.randomUUID(),
                country: (d.country as string | undefined) ?? '',
                city: (d.city as string | undefined) ?? '',
                hasLodging: (d.has_lodging as boolean | undefined) ?? true,
                nights: d.nights != null ? String(d.nights) : '',
                pricePerNight: d.price_per_night != null ? String(d.price_per_night) : '',
                latitude: (d.latitude as number | null | undefined) ?? null,
                longitude: (d.longitude as number | null | undefined) ?? null,
                place_id: (d.place_id as string | null | undefined) ?? null,
                formatted_address: (d.formatted_address as string | null | undefined) ?? null,
                geocoding: 'idle'
              }))
            : [
                {
                  id: crypto.randomUUID(),
                  country: '',
                  city: '',
                  hasLodging: true,
                  nights: '',
                  pricePerNight: '',
                  latitude: null,
                  longitude: null,
                  place_id: null,
                  formatted_address: null,
                  geocoding: 'idle'
                }
              ];

        setDestinations(mapped);

        const uniqueCountries = Array.from(
          new Set(mapped.map((d) => d.country.trim()).filter(Boolean))
        );
        if (uniqueCountries.length === 1) {
          setSameCountry(true);
          setSharedCountry(uniqueCountries[0]);
        } else {
          setSameCountry(false);
          setSharedCountry('');
        }

        // Si on a des détails étape, on conserve le mode "par étape", sinon on retombe en global.
        const hasPerStepDetails = mapped.some((d) => d.hasLodging && (toPositiveInt(d.nights, 0) > 0 || parseMoney(d.pricePerNight) > 0));
        setLodgingMode(hasPerStepDetails ? 'per_step' : 'global');
      } catch (e) {
        console.error(e);
        if (!cancelled) setFormError("Impossible de charger ce voyage pour l’édition.");
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [tripId, user]);

  const toIsoDateLocal = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const applyFundingDepartureDate = () => {
    if (!fundingDateIso) return;

    // If we already have a duration (end - start), keep it.
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (Number.isFinite(diffDays) && diffDays >= 0) {
        const newStart = new Date(fundingDateIso);
        const newEnd = new Date(newStart);
        newEnd.setDate(newEnd.getDate() + diffDays);
        setStartDate(fundingDateIso);
        setEndDate(toIsoDateLocal(newEnd));
        return;
      }
    }

    setStartDate(fundingDateIso);
  };

  const addDestination = () => {
    setDestinations([
      ...destinations,
      {
        id: crypto.randomUUID(),
        country: sameCountry ? sharedCountry : '',
        city: '',
        hasLodging: true,
        nights: '',
        pricePerNight: '',
        latitude: null,
        longitude: null,
        place_id: null,
        formatted_address: null,
        geocoding: 'idle'
      }
    ]);
  };

  const removeDestination = (id: string) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter(d => d.id !== id));
    }
  };

  const updateDestination = (id: string, field: keyof Destination, value: Destination[keyof Destination]) => {
    setDestinations(destinations.map(d =>
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const geocodeAddress = async (city: string, country: string) => {
    const address = `${city}, ${country}`;
    const g = await loadGoogleMaps();
    const geocoder = new g.maps.Geocoder();

    const { results } = await geocoder.geocode({ address });
    const first = results?.[0];
    if (!first) throw new Error("Adresse introuvable");

    const loc = first.geometry.location;
    return {
      latitude: loc.lat(),
      longitude: loc.lng(),
      place_id: first.place_id ?? null,
      formatted_address: first.formatted_address ?? null
    };
  };

  const geocodeDestination = async (id: string) => {
    const dest = destinations.find(d => d.id === id);
    if (!dest) return;
    const country = (sameCountry ? sharedCountry : dest.country).trim();
    if (!dest.city.trim() || !country) return;

    setDestinations(prev => prev.map(d => (d.id === id ? { ...d, geocoding: 'loading' } : d)));
    try {
      const geo = await geocodeAddress(dest.city.trim(), country);
      setDestinations(prev =>
        prev.map(d => (d.id === id ? { ...d, ...geo, geocoding: 'ok' } : d))
      );
    } catch (e) {
      console.warn('Geocoding failed', e);
      setDestinations(prev => prev.map(d => (d.id === id ? { ...d, geocoding: 'error' } : d)));
    }
  };

  const { flight, accommodation, additional, numPassengers, totalCost, costPerPerson } = useMemo(() => {
    const parsedFlight = parseMoney(flightCost);
    const parsedAdditional = parseMoney(additionalExpenses);
    const parsedPassengers = toPositiveInt(passengers, 1);

    const parsedAccommodation =
      lodgingMode === 'global'
        ? parseMoney(accommodationCost)
        : destinations.reduce((sum, d) => {
            if (!d.hasLodging) return sum;
            const nights = toPositiveInt(d.nights, 0);
            const nightly = parseMoney(d.pricePerNight);
            return sum + nights * nightly;
          }, 0);

    const total = parsedFlight + parsedAccommodation + parsedAdditional;
    const perPerson = total / parsedPassengers;

    return {
      flight: parsedFlight,
      accommodation: parsedAccommodation,
      additional: parsedAdditional,
      numPassengers: parsedPassengers,
      totalCost: total,
      costPerPerson: perPerson
    };
  }, [flightCost, accommodationCost, additionalExpenses, passengers, destinations, lodgingMode]);

  const validation = useMemo(() => {
    const nameOk = tripName.trim().length > 0;
    const destinationsOk = sameCountry
      ? sharedCountry.trim().length > 0 && destinations.every(d => d.city.trim().length > 0)
      : destinations.every(d => d.country.trim().length > 0 && d.city.trim().length > 0);
    const passengersOk = toPositiveInt(passengers, 0) > 0;
    const startDateOk = !startDate || startDate >= todayIsoDate();
    const endDateOk = !endDate || !startDate || endDate >= startDate;

    const lodgingOk =
      lodgingMode === 'global'
        ? parseMoney(accommodationCost) >= 0
        : destinations.every(d => {
            if (!d.hasLodging) return true;
            const nights = toPositiveInt(d.nights, 0);
            const nightly = parseMoney(d.pricePerNight);
            return nights > 0 && nightly > 0;
          });

    const canSave = Boolean(user) && nameOk && destinationsOk && passengersOk && startDateOk && endDateOk && lodgingOk;

    return {
      nameOk,
      destinationsOk,
      passengersOk,
      startDateOk,
      endDateOk,
      lodgingOk,
      canSave
    };
  }, [tripName, destinations, passengers, startDate, endDate, user, lodgingMode, accommodationCost, sameCountry, sharedCountry]);

  useEffect(() => {
    if (!sameCountry) return;
    setDestinations((prev) =>
      prev.map((d) =>
        d.country === sharedCountry ? d : { ...d, country: sharedCountry }
      )
    );
  }, [sameCountry, sharedCountry]);

  const handleSave = async () => {
    setFormError(null);

    if (!user) {
      setFormError("Vous devez être connecté pour sauvegarder une estimation.");
      return;
    }

    if (!validation.nameOk || !validation.destinationsOk) {
      setFormError('Veuillez remplir tous les champs obligatoires (nom du voyage et destinations).');
      return;
    }

    if (!validation.passengersOk) {
      setFormError('Le nombre de passagers doit être un entier supérieur ou égal à 1.');
      return;
    }

    if (!validation.startDateOk) {
      setFormError("La date de départ doit être aujourd'hui ou une date future.");
      return;
    }

    if (!validation.endDateOk) {
      setFormError("La date de retour doit être après la date de départ.");
      return;
    }

    if (!validation.lodgingOk) {
      setFormError("Vérifiez les champs d'hébergement : nuitées et prix par nuit doivent être renseignés pour chaque étape avec logement.");
      return;
    }

    setSaving(true);

    try {
      const canGeocode = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
      const destinationsWithGeo: Destination[] = [];

      for (const d of destinations) {
        const base: Destination = { ...d, country: sameCountry ? sharedCountry : d.country };
        if (
          canGeocode &&
          base.city.trim() &&
          base.country.trim() &&
          (base.latitude === null || base.longitude === null)
        ) {
          try {
            const geo = await geocodeAddress(base.city.trim(), base.country.trim());
            base.latitude = geo.latitude;
            base.longitude = geo.longitude;
            base.place_id = geo.place_id;
            base.formatted_address = geo.formatted_address;
          } catch (e) {
            // Non bloquant: on sauvegarde quand même sans coordonnées.
            console.warn('Geocoding skipped (save)', e);
          }
        }
        destinationsWithGeo.push(base);
      }

      let trip: { id: string };

      if (tripId) {
        const { data: updated, error: updErr } = await supabase
          .from('trips')
          .update({
            name: tripName.trim(),
            flight_cost: flight,
            passengers: numPassengers,
            accommodation_cost: accommodation,
            additional_expenses: additional,
            start_date: startDate || null,
            end_date: endDate || null,
            monthly_saving_per_person: monthlySavingPerPerson,
            monthly_saving_total: monthlySavingTotal,
            funding_months_est: fundingMonths,
            funding_date_est: fundingDateIso || null,
            // Backward compatibility for older reads:
            target_date: startDate || null
          })
          .eq('id', tripId)
          .eq('user_id', user.id)
          .select()
          .single();
        if (updErr) throw updErr;
        trip = { id: updated.id };
      } else {
        const { data: created, error: tripError } = await supabase
          .from('trips')
          .insert({
            user_id: user.id,
            name: tripName.trim(),
            flight_cost: flight,
            passengers: numPassengers,
            accommodation_cost: accommodation,
            additional_expenses: additional,
            start_date: startDate || null,
            end_date: endDate || null,
            monthly_saving_per_person: monthlySavingPerPerson,
            monthly_saving_total: monthlySavingTotal,
            funding_months_est: fundingMonths,
            funding_date_est: fundingDateIso || null,
            // Backward compatibility for older reads:
            target_date: startDate || null
          })
          .select()
          .single();

        if (tripError) throw tripError;
        trip = { id: created.id };
      }

      // Remplace les destinations quand on édite
      if (tripId) {
        const { error: delDestErr } = await supabase.from('trip_destinations').delete().eq('trip_id', trip.id);
        if (delDestErr) throw delDestErr;
      }

      const destinationsData = destinationsWithGeo.map((d, index) => ({
        trip_id: trip.id,
        country: d.country,
        city: d.city,
        has_lodging: d.hasLodging,
        nights: d.hasLodging ? toPositiveInt(d.nights, 0) : null,
        price_per_night: d.hasLodging ? parseMoney(d.pricePerNight) : null,
        latitude: d.latitude,
        longitude: d.longitude,
        place_id: d.place_id,
        formatted_address: d.formatted_address,
        order_index: index
      }));

      const { error: destError } = await supabase
        .from('trip_destinations')
        .insert(destinationsData);

      if (destError) throw destError;

      setSaved(true);
      if ((noDatesYet || !startDate) && fundingMonths && monthlySavingPerPerson) {
        setSaveFundingMessage(
          `Voyage financé à 100% dans ~${fundingMonths} mois (si chacun met ${monthlySavingPerPerson.toFixed(0)} €/mois).`
        );
        setTimeout(() => setSaveFundingMessage(null), 6000);
      }
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving trip:', error);
      setFormError("Erreur lors de la sauvegarde du voyage. Réessayez dans un instant.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fadeUp">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
        Retour au tableau de bord
      </button>

      <div className="space-y-6">
        {loadingExisting && (
          <div className="surface p-4 flex items-center gap-3">
            <WaveLoader label="Chargement" />
            <p className="text-sm font-semibold text-gray-800">
              Chargement du voyage…
            </p>
          </div>
        )}
        <div className="surface p-6 sm:p-8 animate-slideUp">
          <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-palm-700 rounded-xl flex items-center justify-center">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Estimation de voyage</h2>
            <p className="text-gray-600 text-sm">Calculez le coût total de votre projet</p>
          </div>
        </div>
        </div>

        {/* Tablet: 1 colonne. Desktop large: 2 colonnes. */}
        <div className="grid xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7 space-y-6">
          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 font-medium">{formError}</p>
            </div>
          )}

          <div className="surface p-5 sm:p-6 animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-900">
                1. Informations
              </p>
              <span className="text-xs font-semibold text-palm-800 bg-palm-50 border border-palm-200 px-2 py-1 rounded-full">
                Voyage
              </span>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du voyage <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-palm-500 focus:ring-2 focus:ring-palm-500 focus:ring-opacity-20 outline-none transition-all"
              placeholder="Ex: Vacances d'été au Japon"
              required
              autoComplete="off"
            />
          </div>

          <div className="surface p-5 sm:p-6 animate-slideUp" style={{ animationDelay: '60ms' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-900">
                2. Hébergements
              </p>
              <span className="text-xs font-semibold text-sand-900 bg-sand-50 border border-sand-200 px-2 py-1 rounded-full">
                Étapes
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Ton voyage a-t-il <strong>plusieurs étapes avec logement</strong> ? Choisis le mode le plus adapté.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLodgingMode('per_step')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  lodgingMode === 'per_step'
                    ? 'border-palm-500 bg-white/70 shadow-sm'
                    : 'border-white/30 bg-white/50 hover:bg-white/70'
                }`}
              >
                <p className="font-semibold text-gray-900">Par étape (recommandé)</p>
                <p className="text-sm text-gray-600">
                  Une estimation précise avec <strong>nuitées</strong> et <strong>prix/nuit</strong> par destination.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setLodgingMode('global')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  lodgingMode === 'global'
                    ? 'border-palm-500 bg-white/70 shadow-sm'
                    : 'border-white/30 bg-white/50 hover:bg-white/70'
                }`}
              >
                <p className="font-semibold text-gray-900">Global</p>
                <p className="text-sm text-gray-600">
                  Tu saisis un <strong>montant total</strong> d’hébergement pour tout le voyage.
                </p>
              </button>
            </div>

            {lodgingMode === 'global' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Hotel className="w-4 h-4" />
                    <span>Coût total des hébergements</span>
                  </div>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={accommodationCost}
                  onChange={(e) => setAccommodationCost(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-palm-500 focus:ring-2 focus:ring-palm-500 focus:ring-opacity-20 outline-none transition-all"
                  placeholder="Ex: 1200,00"
                  autoComplete="off"
                />
              </div>
            )}
          </div>

          <div className="surface p-5 sm:p-6 animate-slideUp" style={{ animationDelay: '120ms' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-900">
                3. Destinations & étapes
              </p>
              <span className="text-xs font-semibold text-palm-800 bg-palm-50 border border-palm-200 px-2 py-1 rounded-full">
                Itinéraire
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Destinations <span className="text-red-500">*</span>
              </label>
              <button
                onClick={addDestination}
                className="flex items-center space-x-1 text-sm text-palm-700 hover:text-palm-800 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter une étape</span>
              </button>
            </div>

            <div className="mb-4 flex items-center justify-between gap-3 bg-white/60 border border-white/40 rounded-xl p-3">
              <p className="text-sm font-semibold text-gray-900">
                Pays
              </p>
              <div className="segmented shrink-0">
                <button
                  type="button"
                  onClick={() => setSameCountry(true)}
                  className={`seg-btn ${sameCountry ? 'seg-btn-active' : ''}`}
                  title="Un seul pays"
                >
                  Un seul pays
                </button>
                <button
                  type="button"
                  onClick={() => setSameCountry(false)}
                  className={`seg-btn ${!sameCountry ? 'seg-btn-active' : ''}`}
                  title="Multi-pays"
                >
                  Multi-pays
                </button>
              </div>
            </div>

            {sameCountry && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pays (commun à toutes les étapes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sharedCountry}
                  onChange={(e) => setSharedCountry(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-palm-200 bg-white/70 focus:border-palm-500 focus:ring-2 focus:ring-palm-500 focus:ring-opacity-20 outline-none transition-all"
                  placeholder="Ex: Japon"
                  required
                  autoComplete="country-name"
                />
              </div>
            )}

            <div className="space-y-3">
              {destinations.map((dest, index) => (
                <div key={dest.id} className="flex gap-3 items-start min-w-0">
                  <div className="flex-1 min-w-0 space-y-3 surface-soft p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">
                        Étape {index + 1}
                      </p>
                      <span className="text-xs font-semibold text-sand-900 bg-sand-50 border border-sand-200 px-2 py-1 rounded-full">
                        {dest.hasLodging ? 'Avec logement' : 'Sans logement'}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {!sameCountry ? (
                        <input
                          type="text"
                          value={dest.country}
                          onChange={(e) => {
                            const next = e.target.value;
                            setDestinations(prev =>
                              prev.map(d =>
                                d.id === dest.id
                                  ? {
                                      ...d,
                                      country: next,
                                      latitude: null,
                                      longitude: null,
                                      place_id: null,
                                      formatted_address: null,
                                      geocoding: 'idle'
                                    }
                                  : d
                              )
                            );
                          }}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-palm-500 focus:ring-2 focus:ring-palm-500 focus:ring-opacity-20 outline-none transition-all"
                          placeholder={`Pays (étape ${index + 1})`}
                          required
                          autoComplete="country-name"
                        />
                      ) : (
                        <div className="w-full px-4 py-3 rounded-lg border border-white/55 bg-white/55 text-gray-800 font-semibold">
                          {sharedCountry?.trim() ? sharedCountry : 'Pays (à renseigner ci-dessus)'}
                        </div>
                      )}
                      <input
                        type="text"
                        value={dest.city}
                        onChange={(e) => {
                          const next = e.target.value;
                          setDestinations(prev =>
                            prev.map(d =>
                              d.id === dest.id
                                ? {
                                    ...d,
                                    city: next,
                                    latitude: null,
                                    longitude: null,
                                    place_id: null,
                                    formatted_address: null,
                                    geocoding: 'idle'
                                  }
                                : d
                            )
                          );
                        }}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-palm-500 focus:ring-2 focus:ring-palm-500 focus:ring-opacity-20 outline-none transition-all"
                        placeholder="Ville"
                        required
                        autoComplete="address-level2"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        {dest.latitude !== null && dest.longitude !== null ? (
                          <p className="text-xs text-palm-800 font-semibold truncate">
                            Localisé{dest.formatted_address ? ` — ${dest.formatted_address}` : ''}
                          </p>
                        ) : dest.geocoding === 'error' ? (
                          <p className="text-xs text-red-700 font-semibold">
                            Impossible de localiser cette étape (vérifie la ville/pays).
                          </p>
                        ) : (
                          <p className="text-xs text-gray-600">
                            Localisation pour afficher la carte
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => geocodeDestination(dest.id)}
                        disabled={
                          dest.geocoding === 'loading' ||
                          !dest.city.trim() ||
                          !(sameCountry ? sharedCountry.trim() : dest.country.trim())
                        }
                        className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-palm-700 bg-palm-700 hover:bg-palm-800 text-white text-xs font-extrabold tracking-wide transition-all disabled:opacity-45 disabled:cursor-not-allowed"
                        title="Récupérer les coordonnées"
                      >
                        {dest.geocoding === 'loading' ? (
                          <WaveLoader className="scale-75" label="Localisation en cours" />
                        ) : (
                          <>
                            <MapPin className="w-4 h-4" />
                            Localiser
                          </>
                        )}
                      </button>
                    </div>

                    {lodgingMode === 'per_step' && (
                      <div className="bg-white/60 rounded-xl border border-white/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Hotel className="w-4 h-4 text-gray-600" />
                            <p className="text-sm font-semibold text-gray-900">Logement sur cette étape ?</p>
                          </div>
                          <div className="segmented shrink-0">
                            <button
                              type="button"
                              onClick={() => updateDestination(dest.id, 'hasLodging', true)}
                              className={`seg-btn ${dest.hasLodging ? 'seg-btn-active' : ''}`}
                              title="Avec logement"
                            >
                              Oui
                            </button>
                            <button
                              type="button"
                              onClick={() => updateDestination(dest.id, 'hasLodging', false)}
                              className={`seg-btn ${!dest.hasLodging ? 'seg-btn-active' : ''}`}
                              title="Sans logement"
                            >
                              Non
                            </button>
                          </div>
                        </div>

                        {dest.hasLodging && (
                          <div className="grid sm:grid-cols-3 gap-3 mt-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Nuitées</label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={dest.nights}
                                onChange={(e) => updateDestination(dest.id, 'nights', e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-palm-500 focus:ring-2 focus:ring-palm-500 focus:ring-opacity-20 outline-none transition-all"
                                placeholder="Ex: 5"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Prix / nuit</label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={dest.pricePerNight}
                                onChange={(e) => updateDestination(dest.id, 'pricePerNight', e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-palm-500 focus:ring-2 focus:ring-palm-500 focus:ring-opacity-20 outline-none transition-all"
                                placeholder="Ex: 80,00"
                                autoComplete="off"
                              />
                            </div>
                            <div className="sm:text-right">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Total étape</label>
                              <div className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 font-semibold">
                                {formatEur(toPositiveInt(dest.nights, 0) * parseMoney(dest.pricePerNight))}
                              </div>
                            </div>

                            {dest.hasLodging &&
                              (toPositiveInt(dest.nights, 0) <= 0 || parseMoney(dest.pricePerNight) <= 0) && (
                              <p className="sm:col-span-3 text-xs text-red-600">
                                Renseigne des nuitées et un prix/nuit valides pour cette étape.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {destinations.length > 1 && (
                    <button
                      onClick={() => removeDestination(dest.id)}
                      className="shrink-0 p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={addDestination}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/50 bg-white/60 hover:bg-white/80 text-gray-900 font-semibold py-3 transition-all"
                title="Ajouter une étape"
              >
                <Plus className="w-5 h-5" />
                Ajouter une étape
              </button>
              <p className="text-xs text-gray-600 mt-2">
                Astuce: ce bouton reste tout en bas pour ajouter rapidement une étape, même quand la liste est longue.
              </p>
            </div>
          </div>

          <div className="surface p-5 sm:p-6 animate-slideUp" style={{ animationDelay: '180ms' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-900">
                4. Budget
              </p>
              <span className="text-xs font-semibold text-palm-800 bg-palm-50 border border-palm-200 px-2 py-1 rounded-full">
                Coûts
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Plane className="w-4 h-4" />
                  <span>Prix du vol aller-retour</span>
                </div>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={flightCost}
                onChange={(e) => setFlightCost(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-palm-500 focus:ring-2 focus:ring-palm-500 focus:ring-opacity-20 outline-none transition-all"
                placeholder="Ex: 450,00"
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-1">
                Astuce: vous pouvez saisir une virgule (ex: 450,50).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Nombre de passagers</span>
                </div>
              </label>
              <select
                value={passengers}
                onChange={(e) => setPassengers(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-palm-500 focus:ring-2 focus:ring-palm-500 focus:ring-opacity-20 outline-none transition-all bg-white/70"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                Pour plus de 12 voyageurs, on peut l’étendre.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4" />
                <span>Dépenses supplémentaires (optionnel)</span>
              </div>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={additionalExpenses}
              onChange={(e) => setAdditionalExpenses(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-palm-500 focus:ring-2 focus:ring-palm-500 focus:ring-opacity-20 outline-none transition-all"
              placeholder="Ex: 300,00"
              autoComplete="off"
            />
          </div>
          </div>

          <div className="surface p-5 sm:p-6 animate-slideUp" style={{ animationDelay: '240ms' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-900">
                5. Dates du voyage
              </p>
              <span className="text-xs font-semibold text-sand-900 bg-sand-50 border border-sand-200 px-2 py-1 rounded-full">
                Planification
              </span>
            </div>

            <div className="mb-4 flex items-center justify-between gap-3 bg-white/60 border border-white/40 rounded-xl p-3">
              <p className="text-sm font-semibold text-gray-900">
                Planification
              </p>
              <div className="segmented shrink-0">
                <button
                  type="button"
                  onClick={() => setNoDatesYet(false)}
                  className={`seg-btn ${!noDatesYet ? 'seg-btn-active' : ''}`}
                  title="J’ai mes dates"
                >
                  J’ai mes dates
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNoDatesYet(true);
                    setStartDate('');
                    setEndDate('');
                  }}
                  className={`seg-btn ${noDatesYet ? 'seg-btn-active' : ''}`}
                  title="Je n’ai pas encore de dates"
                >
                  Pas de dates
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Date de départ</span>
                  </div>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-palm-500 focus:ring-2 focus:ring-palm-500 focus:ring-opacity-20 outline-none transition-all"
                  min={todayIsoDate()}
                  disabled={noDatesYet}
                />
                {!validation.startDateOk && (
                  <p className="text-xs text-red-600 mt-1">
                    La date de départ doit être future.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Date de retour</span>
                  </div>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-palm-500 focus:ring-2 focus:ring-palm-500 focus:ring-opacity-20 outline-none transition-all"
                  min={startDate || todayIsoDate()}
                  disabled={noDatesYet}
                />
                {!validation.endDateOk && (
                  <p className="text-xs text-red-600 mt-1">
                    La date de retour doit être après le départ.
                  </p>
                )}
              </div>
            </div>

            {/* Module budget/financement au bon endroit (dates) */}
            <div className="mt-5">
              {totalCost > 0 ? (
                <FundingPlanner
                  totalCost={totalCost}
                  passengers={numPassengers}
                  departureDate={noDatesYet ? undefined : (startDate || undefined)}
                  onFundingUpdate={(info) => {
                    setFundingDateIso(info.fundingDateIso);
                    setFundingMonths(info.monthsNeeded);
                    setMonthlySavingPerPerson(info.monthlyPerPerson);
                    setMonthlySavingTotal(info.monthlyTotal);
                  }}
                />
              ) : (
                <div className="bg-white/60 rounded-xl border border-white/40 p-4">
                  <p className="text-sm text-gray-700">
                    Renseigne d’abord le <strong>budget</strong> (vol, hébergements, autres) pour simuler le financement.
                  </p>
                </div>
              )}
            </div>

            {fundingDateIso && (
              <div className="mt-4 flex items-center justify-between gap-3 bg-white/60 border border-white/40 rounded-xl p-3">
                <p className="text-xs text-gray-700">
                  Départ faisable estimé: <span className="font-bold">{new Date(fundingDateIso).toLocaleDateString('fr-FR')}</span>
                </p>
                <button
                  type="button"
                  onClick={applyFundingDepartureDate}
                  className="px-3 py-2 rounded-full border border-white/55 bg-white/60 hover:bg-white/80 text-gray-900 text-xs font-semibold transition-all"
                  title="Ajuster la date de départ selon votre épargne"
                >
                  Partir une fois financé
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !validation.canSave}
              className="flex-1 btn-palm py-3 flex items-center justify-center space-x-2"
            >
              {saving ? (
                <WaveLoader label="Sauvegarde en cours" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{saved ? 'Sauvegardé !' : 'Sauvegarder'}</span>
                </>
              )}
            </button>
          </div>
          {saveFundingMessage && (
            <div className="mt-3 bg-palm-50 border border-palm-200 rounded-xl p-3">
              <p className="text-sm font-semibold text-palm-900">{saveFundingMessage}</p>
            </div>
          )}
        </div>

        <div className="xl:col-span-5">
          <details className="surface p-5 sm:p-6 animate-slideUp xl:sticky xl:top-24" open>
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-900">
                  Résumé
                </p>
                <span className="text-xs font-semibold text-palm-800 bg-palm-50 border border-palm-200 px-2 py-1 rounded-full">
                  Live
                </span>
              </div>
            </summary>

            {totalCost > 0 ? (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-sand-50 rounded-xl p-4 border border-sand-200">
                    <p className="text-sm text-sand-800 font-medium mb-1">Coût total</p>
                    <p className="text-3xl font-bold text-sand-900">{formatEur(totalCost)}</p>
                  </div>

                  <div className="bg-palm-50 rounded-xl p-4 border border-palm-200">
                    <p className="text-sm text-palm-800 font-medium mb-1">Par personne</p>
                    <p className="text-3xl font-bold text-palm-900">{formatEur(costPerPerson)}</p>
                  </div>
                </div>

                <ExpenseGauge
                  flightCost={flight}
                  accommodationCost={accommodation}
                  additionalExpenses={additional}
                />

                <TripMap destinations={destinations} />
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Renseigne quelques montants pour voir le résumé se construire en direct.
              </p>
            )}
          </details>
        </div>
      </div>

      </div>
    </div>
  );
};
