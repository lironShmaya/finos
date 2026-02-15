import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '../shared/CurrencyFormatter';
import { Target } from 'lucide-react';

export default function GoalsProgress({ goals }) {
  if (!goals || goals.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Goals</h3>
        <p className="text-sm text-gray-400 text-center py-6">No goals set yet</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.4 }}
      className="rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-center gap-2 mb-5">
        <Target className="h-4 w-4 text-purple-500" />
        <h3 className="text-sm font-semibold text-gray-900">Goals Progress</h3>
      </div>
      <div className="space-y-4">
        {goals.slice(0, 5).map((goal, idx) => {
          const pct = goal.target_amount > 0 ? Math.min(100, ((goal.current_amount || 0) / goal.target_amount) * 100) : 0;
          return (
            <motion.div 
              key={goal.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + idx * 0.1, duration: 0.3 }}
              className="space-y-1.5"
            >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{goal.name}</span>
              <span className="text-xs text-gray-400">{pct.toFixed(0)}%</span>
            </div>
            <Progress value={pct} className="h-1.5" />
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{formatCurrency(goal.current_amount || 0, goal.currency)}</span>
              <span>{formatCurrency(goal.target_amount, goal.currency)}</span>
            </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}