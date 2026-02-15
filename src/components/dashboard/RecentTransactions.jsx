import React from 'react';
import { formatCurrency } from '../shared/CurrencyFormatter';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';

const typeIcons = {
  income: ArrowUpRight,
  expense: ArrowDownRight,
  transfer: ArrowRightLeft,
};

const typeBg = {
  income: 'bg-emerald-50 text-emerald-600',
  expense: 'bg-red-50 text-red-500',
  transfer: 'bg-blue-50 text-blue-500',
};

export default function RecentTransactions({ transactions }) {
  const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  if (recent.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <p className="text-sm text-gray-400 text-center py-6">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Transactions</h3>
      <div className="space-y-1">
        {recent.map(t => {
          const Icon = typeIcons[t.type] || ArrowDownRight;
          const bg = typeBg[t.type] || typeBg.expense;
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors">
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${bg}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{t.merchant || t.description || 'Transaction'}</p>
                <p className="text-xs text-gray-400">{t.category_name || 'Uncategorized'} · {format(new Date(t.date), 'MMM d')}</p>
              </div>
              <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(t.amount), t.currency)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}