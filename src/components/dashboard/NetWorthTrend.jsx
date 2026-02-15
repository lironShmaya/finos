import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../shared/CurrencyFormatter';

export default function NetWorthTrend({ accounts, currency = 'USD' }) {
  const totalAssets = accounts.filter(a => a.is_asset !== false).reduce((s, a) => s + (a.current_balance || 0), 0);
  const totalLiabilities = accounts.filter(a => a.is_asset === false).reduce((s, a) => s + Math.abs(a.current_balance || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  // Simulated trend data based on current net worth
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const data = months.map((month, i) => ({
    month,
    value: Math.round(netWorth * (0.85 + (i * 0.02) + Math.random() * 0.02))
  }));
  if (data.length > 0) data[data.length - 1].value = Math.round(netWorth);

  return (
    <div className="rounded-2xl border border-[#1C7293]/20 bg-[#0D1B2A] p-6 backdrop-blur-xl hover:border-[#1C7293]/40 transition-all duration-200">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-[#F4F7FB]">Net Worth</h3>
        <span className="text-xs text-[#A6E1FA]/60">Last 8 months</span>
      </div>
      <p className="text-2xl font-bold text-[#A6E1FA] font-mono mb-4">{formatCurrency(netWorth, currency)}</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#111827" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#111827" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            formatter={(v) => formatCurrency(v, currency)}
            contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          />
          <Area type="monotone" dataKey="value" stroke="#111827" strokeWidth={2} fill="url(#nwGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}