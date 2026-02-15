import React from 'react';
import StatCard from '../shared/StatCard';
import { formatCurrency } from '../shared/CurrencyFormatter';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';

export default function MonthSnapshot({ transactions, currency = 'USD' }) {
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const income = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
  const expenses = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const savings = income - expenses;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { title: "Income", value: formatCurrency(income, currency), icon: TrendingUp, subtitle: "This month", delay: 0 },
        { title: "Spending", value: formatCurrency(expenses, currency), icon: TrendingDown, subtitle: "This month", delay: 0.05 },
        { title: "Net Savings", value: formatCurrency(savings, currency), icon: PiggyBank, subtitle: `${savingsRate}% savings rate`, trendUp: savings >= 0, trend: `${savingsRate}%`, delay: 0.1 },
        { title: "Cash Flow", value: formatCurrency(savings, currency), icon: Wallet, subtitle: savings >= 0 ? 'Positive' : 'Negative', delay: 0.15 }
      ].map((card, i) => (
        <div key={i} style={{ animationDelay: `${card.delay}s` }} className="animate-in">
          <StatCard {...card} />
        </div>
      ))}
    </div>
  );
}