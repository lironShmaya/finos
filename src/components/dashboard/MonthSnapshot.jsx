import React from 'react';
import { motion } from 'framer-motion';
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
        { title: "Spending", value: formatCurrency(expenses, currency), icon: TrendingDown, subtitle: "This month", delay: 0.1 },
        { title: "Net Savings", value: formatCurrency(savings, currency), icon: PiggyBank, subtitle: `${savingsRate}% savings rate`, trendUp: savings >= 0, trend: `${savingsRate}%`, delay: 0.2 },
        { title: "Cash Flow", value: formatCurrency(savings, currency), icon: Wallet, subtitle: savings >= 0 ? 'Positive' : 'Negative', delay: 0.3 }
      ].map((card, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: card.delay, duration: 0.4 }}
        >
          <StatCard {...card} />
        </motion.div>
      ))}
    </div>
  );
}