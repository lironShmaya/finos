import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../shared/CurrencyFormatter';

const COLORS = ['#111827', '#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#8B5CF6', '#0891B2'];

export default function TopCategories({ transactions, budgets, currency = 'USD' }) {
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense';
  });

  const catMap = {};
  thisMonth.forEach(t => {
    const cat = t.category_name || 'Uncategorized';
    catMap[cat] = (catMap[cat] || 0) + Math.abs(t.amount);
  });

  const budgetMap = {};
  budgets.forEach(b => {
    if (b.category_name) budgetMap[b.category_name] = b.amount;
  });

  const data = Object.entries(catMap)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([name, actual]) => ({
      name: name.length > 12 ? name.slice(0, 12) + '…' : name,
      actual,
      budget: budgetMap[name] || 0,
    }));

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1C7293]/20 bg-[#0D1B2A] p-6 backdrop-blur-xl">
        <h3 className="text-sm font-semibold text-[#F4F7FB] mb-4">Top Categories</h3>
        <p className="text-sm text-[#A6E1FA]/40 text-center py-8">No expense data this month</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#1C7293]/20 bg-[#0D1B2A] p-6 backdrop-blur-xl hover:border-[#1C7293]/40 transition-all duration-200">
      <h3 className="text-sm font-semibold text-[#F4F7FB] mb-4">Top Categories This Month</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => formatCurrency(value, currency)}
            contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          />
          <Bar dataKey="actual" radius={[0, 6, 6, 0]} barSize={18}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}