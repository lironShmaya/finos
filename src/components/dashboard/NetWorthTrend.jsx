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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-900">Net Worth</h3>
        <span className="text-xs text-gray-400">Last 8 months</span>
      </div>
      <motion.p 
        className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      >{formatCurrency(netWorth, currency)}</motion.p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.3} />
              <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            formatter={(v) => formatCurrency(v, currency)}
            contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="url(#nwGradStroke)" 
            strokeWidth={2.5} 
            fill="url(#nwGrad)" 
            dot={false}
            animationDuration={1200}
            animationEasing="ease-out"
          />
          <defs>
            <linearGradient id="nwGradStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}