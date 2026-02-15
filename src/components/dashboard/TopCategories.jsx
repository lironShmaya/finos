import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../shared/CurrencyFormatter';

const COLORS = ['#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#14B8A6', '#6366F1', '#0EA5E9'];

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
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Categories</h3>
        <p className="text-sm text-gray-400 text-center py-8">No expense data this month</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-lg transition-shadow duration-300"
    >
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Categories This Month</h3>
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
    </motion.div>
  );
}