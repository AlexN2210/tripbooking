import { Plane, Hotel, Wallet } from 'lucide-react';

interface ExpenseGaugeProps {
  flightCost: number;
  accommodationCost: number;
  additionalExpenses: number;
}

export const ExpenseGauge = ({ flightCost, accommodationCost, additionalExpenses }: ExpenseGaugeProps) => {
  const total = flightCost + accommodationCost + additionalExpenses;

  if (total === 0) return null;

  const flightPercent = (flightCost / total) * 100;
  const accommodationPercent = (accommodationCost / total) * 100;
  const additionalPercent = (additionalExpenses / total) * 100;

  const expenses = [
    {
      label: 'Vol',
      amount: flightCost,
      percent: flightPercent,
      color: 'bg-sand-400',
      lightColor: 'bg-sand-100',
      icon: Plane,
      iconColor: 'text-sand-800'
    },
    {
      label: 'Hébergement',
      amount: accommodationCost,
      percent: accommodationPercent,
      color: 'bg-palm-600',
      lightColor: 'bg-palm-100',
      icon: Hotel,
      iconColor: 'text-palm-800'
    },
    {
      label: 'Autres',
      amount: additionalExpenses,
      percent: additionalPercent,
      color: 'bg-stone-500',
      lightColor: 'bg-stone-100',
      icon: Wallet,
      iconColor: 'text-stone-700'
    }
  ].filter(e => e.amount > 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Répartition des dépenses</h3>

      <div className="flex h-8 rounded-full overflow-hidden shadow-inner bg-gray-100">
        {expenses.map((expense, index) => (
          <div
            key={index}
            className={`${expense.color} transition-all duration-1000 ease-out relative group`}
            style={{
              width: `${expense.percent}%`,
              animation: `slideIn 1s ease-out ${index * 0.2}s both`
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white font-semibold text-xs">
                {expense.percent.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {expenses.map((expense, index) => {
          const Icon = expense.icon;
          return (
            <div
              key={index}
              className={`${expense.lightColor} rounded-xl p-4 border ${expense.color.replace('bg-', 'border-').replace('500', '200')} transform hover:scale-105 transition-transform`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${expense.color} rounded-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${expense.iconColor}`}>
                    {expense.label}
                  </p>
                  <div className="flex items-baseline space-x-2">
                    <p className={`text-xl font-bold ${expense.iconColor}`}>
                      {expense.amount.toFixed(0)} €
                    </p>
                    <p className={`text-sm ${expense.iconColor} opacity-75`}>
                      {expense.percent.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
