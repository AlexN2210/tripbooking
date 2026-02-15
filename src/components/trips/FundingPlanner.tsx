import { useEffect, useMemo, useState } from 'react';
import { Calendar, TrendingUp, BadgeCheck, PiggyBank } from 'lucide-react';

function parseMoney(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  const normalized = trimmed
    .replace(/\s/g, '')
    .replace(/€/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  const num = Number(normalized);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, num);
}

function formatEur(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toIsoDateLocal(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

interface FundingPlannerProps {
  totalCost: number;
  passengers: number;
  departureDate: string; // YYYY-MM-DD
  onFundingUpdate?: (info: {
    monthlyPerPerson: number;
    monthlyTotal: number;
    requiredMonthlyPerPerson: number;
    requiredMonthlyTotal: number;
    monthsNeeded: number | null;
    fundingDateIso: string | null;
    feasibleBeforeDeparture: boolean;
  }) => void;
}

export function FundingPlanner({ totalCost, passengers, departureDate, onFundingUpdate }: FundingPlannerProps) {
  const [monthlyPerPersonInput, setMonthlyPerPersonInput] = useState('');

  const computed = useMemo(() => {
    const today = new Date();
    const departure = new Date(departureDate);
    const diffTime = departure.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { invalidDate: true as const };
    }

    const monthsUntil = Math.max(1, Math.ceil(diffDays / 30));
    const requiredMonthlyTotal = totalCost / monthsUntil;
    const requiredMonthlyPerPerson = requiredMonthlyTotal / Math.max(1, passengers);

    const monthlyPerPerson =
      monthlyPerPersonInput.trim().length > 0 ? parseMoney(monthlyPerPersonInput) : requiredMonthlyPerPerson;
    const monthlyTotal = monthlyPerPerson * Math.max(1, passengers);

    const monthsNeeded = monthlyTotal > 0 ? Math.ceil(totalCost / monthlyTotal) : Infinity;
    const estimatedFundingDate =
      Number.isFinite(monthsNeeded) ? addDays(today, monthsNeeded * 30) : null;

    const feasibleBeforeDeparture =
      estimatedFundingDate ? estimatedFundingDate.getTime() <= departure.getTime() : false;

    return {
      invalidDate: false as const,
      monthsUntil,
      requiredMonthlyTotal,
      requiredMonthlyPerPerson,
      monthlyPerPerson,
      monthlyTotal,
      monthsNeeded,
      estimatedFundingDate,
      feasibleBeforeDeparture,
      departure,
    };
  }, [departureDate, monthlyPerPersonInput, passengers, totalCost]);

  useEffect(() => {
    if (!onFundingUpdate) return;
    if (computed.invalidDate) {
      onFundingUpdate({
        monthlyPerPerson: 0,
        monthlyTotal: 0,
        requiredMonthlyPerPerson: 0,
        requiredMonthlyTotal: 0,
        monthsNeeded: null,
        fundingDateIso: null,
        feasibleBeforeDeparture: false,
      });
      return;
    }

    onFundingUpdate({
      monthlyPerPerson: computed.monthlyPerPerson,
      monthlyTotal: computed.monthlyTotal,
      requiredMonthlyPerPerson: computed.requiredMonthlyPerPerson,
      requiredMonthlyTotal: computed.requiredMonthlyTotal,
      monthsNeeded: Number.isFinite(computed.monthsNeeded) ? computed.monthsNeeded : null,
      fundingDateIso: computed.estimatedFundingDate ? toIsoDateLocal(computed.estimatedFundingDate) : null,
      feasibleBeforeDeparture: computed.feasibleBeforeDeparture,
    });
  }, [computed, onFundingUpdate]);

  if (computed.invalidDate) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-700 font-medium">
          La date de départ est dans le passé. Choisis une date future pour simuler l’épargne.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Financement & épargne</h3>
        <span className="text-xs font-semibold text-sand-900 bg-sand-50 border border-sand-200 px-2 py-1 rounded-full">
          Par personne
        </span>
      </div>

      {/* Best (cheapest) option card */}
      <div className="bg-gradient-to-br from-sand-50 to-palm-50 rounded-xl border border-sand-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="w-5 h-5 text-sand-800" />
              <p className="text-sm font-extrabold text-gray-900">
                Meilleure solution (la moins chère)
              </p>
            </div>
            <p className="text-sm text-gray-700">
              Pour financer <strong>{formatEur(totalCost)}</strong> avant le départ, le minimum est :
            </p>
            <p className="mt-2 text-2xl font-extrabold text-palm-900">
              {formatEur(computed.requiredMonthlyPerPerson)} <span className="text-sm font-bold text-palm-800">/ mois / personne</span>
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-700">
              <BadgeCheck className="w-4 h-4 text-palm-700" />
              <span>
                Objectif atteint en ~{computed.monthsUntil} mois (si chacun met ce montant).
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMonthlyPerPersonInput(computed.requiredMonthlyPerPerson.toFixed(0))}
            className="shrink-0 px-4 py-2 rounded-full border border-white/50 bg-white/60 hover:bg-white/80 text-gray-900 font-semibold transition-all"
            title="Appliquer le minimum recommandé"
          >
            Appliquer
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-white/60 rounded-xl border border-white/40 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-gray-600" />
            <p className="text-sm font-semibold text-gray-800">Départ</p>
          </div>
          <p className="font-bold text-gray-900">
            {computed.departure.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          <p className="text-xs text-gray-600">
            Il reste ~{computed.monthsUntil} mois
          </p>
        </div>

        <div className="bg-palm-50 rounded-xl border border-palm-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-palm-800" />
            <p className="text-sm font-semibold text-palm-800">Requis / mois</p>
          </div>
          <p className="font-extrabold text-palm-900">
            {formatEur(computed.requiredMonthlyPerPerson)}
          </p>
          <p className="text-xs text-palm-800">par personne</p>
        </div>

        <div className="bg-sand-50 rounded-xl border border-sand-200 p-4">
          <p className="text-sm font-semibold text-sand-800 mb-1">Requis / mois (total)</p>
          <p className="font-extrabold text-sand-900">
            {formatEur(computed.requiredMonthlyTotal)}
          </p>
          <p className="text-xs text-sand-800">
            pour {passengers} voyageur{passengers > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="bg-white/60 rounded-xl border border-white/40 p-4">
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Votre épargne mensuelle (par personne)
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={monthlyPerPersonInput}
          onChange={(e) => setMonthlyPerPersonInput(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-palm-500 focus:ring-2 focus:ring-palm-500 focus:ring-opacity-20 outline-none transition-all"
          placeholder={`${computed.requiredMonthlyPerPerson.toFixed(0)} (par défaut = requis)`}
        />
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-600 mb-1">Total / mois</p>
            <p className="font-bold text-gray-900">{formatEur(computed.monthlyTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Durée estimée</p>
            <p className="font-bold text-gray-900">
              {Number.isFinite(computed.monthsNeeded) ? `${computed.monthsNeeded} mois` : '—'}
            </p>
          </div>
        </div>

        {computed.estimatedFundingDate && (
          <div className={`mt-3 rounded-lg px-4 py-3 border ${
            computed.feasibleBeforeDeparture ? 'bg-palm-50 border-palm-200' : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm font-semibold ${
              computed.feasibleBeforeDeparture ? 'text-palm-900' : 'text-red-800'
            }`}>
              {computed.feasibleBeforeDeparture ? 'OK avant le départ' : 'Trop juste pour le départ'}
            </p>
            <p className={`text-xs ${
              computed.feasibleBeforeDeparture ? 'text-palm-800' : 'text-red-700'
            }`}>
              Date estimée de financement: {computed.estimatedFundingDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

