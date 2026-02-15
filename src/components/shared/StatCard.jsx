import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </div>
          )}
        </div>
        {Icon && (
          <div className="rounded-xl bg-gray-50 p-3">
            <Icon className="h-5 w-5 text-gray-600" />
          </div>
        )}
      </div>
    </motion.div>
  );
}