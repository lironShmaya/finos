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
      <div className="rounded-2xl border border-[#1C7293]/20 bg-[#0D1B2A] p-6 backdrop-blur-xl">
        <h3 className="text-sm font-semibold text-[#F4F7FB] mb-4">Recent Transactions</h3>
        <p className="text-sm text-[#A6E1FA]/40 text-center py-6">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#1C7293]/20 bg-[#0D1B2A] p-6 backdrop-blur-xl hover:border-[#1C7293]/40 transition-all duration-200">
      <h3 className="text-sm font-semibold text-[#F4F7FB] mb-4">Recent Transactions</h3>
      <div className="space-y-1">
        {recent.map(t => {
          const Icon = typeIcons[t.type] || ArrowDownRight;
          const bg = typeBg[t.type] || typeBg.expense;
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#1C7293]/10 transition-all duration-150 cursor-pointer group">
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${bg.replace('bg-emerald-50', 'bg-[#2ED573]/20').replace('bg-red-50', 'bg-[#FF6B6B]/20').replace('bg-blue-50', 'bg-[#1C7293]/20')} border border-current/20 group-hover:scale-110 transition-transform duration-150`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#F4F7FB] truncate">{t.merchant || t.description || 'Transaction'}</p>
                <p className="text-xs text-[#A6E1FA]/60">{t.category_name || 'Uncategorized'} · {format(new Date(t.date), 'MMM d')}</p>
              </div>
              <span className={`text-sm font-semibold font-mono ${t.type === 'income' ? 'text-[#2ED573]' : 'text-[#F4F7FB]'}`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(t.amount), t.currency)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}