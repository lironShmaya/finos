import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../shared/CurrencyFormatter';
import { DollarSign, Receipt, TrendingDown, PiggyBank } from 'lucide-react';

export default function BudgetBreakdown({ budgets, transactions }) {
  const now = new Date();
  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Group budgets by category type
  const getCategoryType = (categoryId) => {
    // Find category in the list - we'll need to fetch categories
    // For now, use category_name as fallback
    return null;
  };
  
  const incomeBudgets = budgets.filter(b => {
    const catName = b.category_name?.toLowerCase() || '';
    return catName.includes('salary') || catName.includes('income') || catName.includes('freelance');
  });
  
  const expensesBudgets = budgets.filter(b => {
    const catName = b.category_name?.toLowerCase() || '';
    return catName.includes('groceries') || catName.includes('dining') || catName.includes('entertainment') || 
           catName.includes('shopping') || catName.includes('food') || catName.includes('clothes');
  });
  
  const billsBudgets = budgets.filter(b => {
    const catName = b.category_name?.toLowerCase() || '';
    return catName.includes('rent') || catName.includes('utilities') || catName.includes('subscription') ||
           catName.includes('internet') || catName.includes('cellular') || catName.includes('insurance') ||
           catName.includes('electricity') || catName.includes('water') || catName.includes('lease');
  });
  
  const savingsBudgets = budgets.filter(b => {
    const catName = b.category_name?.toLowerCase() || '';
    return catName.includes('saving') || catName.includes('invest') || catName.includes('pension') ||
           catName.includes('espp');
  });

  const getSpent = (categoryName) => {
    return thisMonthTx
      .filter(t => t.category_name === categoryName && t.type === 'expense')
      .reduce((s, t) => s + Math.abs(t.amount), 0);
  };

  const getActual = (categoryName) => {
    return thisMonthTx
      .filter(t => t.category_name === categoryName)
      .reduce((s, t) => s + (t.type === 'income' ? t.amount : Math.abs(t.amount)), 0);
  };

  const calculateSection = (sectionBudgets, isIncome = false) => {
    const totalBudget = sectionBudgets.reduce((s, b) => s + b.amount, 0);
    const totalActual = sectionBudgets.reduce((s, b) => 
      s + (isIncome ? getActual(b.category_name) : getSpent(b.category_name)), 0
    );
    const leftToSpend = totalBudget - totalActual;
    return { totalBudget, totalActual, leftToSpend };
  };

  const sections = [
    {
      title: 'INCOME',
      budgets: incomeBudgets,
      color: 'emerald',
      icon: DollarSign,
      isIncome: true
    },
    {
      title: 'EXPENSES',
      budgets: expensesBudgets,
      color: 'rose',
      icon: TrendingDown,
      isIncome: false
    },
    {
      title: 'BILLS',
      budgets: billsBudgets,
      color: 'blue',
      icon: Receipt,
      isIncome: false
    },
    {
      title: 'SAVINGS',
      budgets: savingsBudgets,
      color: 'purple',
      icon: PiggyBank,
      isIncome: false
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-gray-100 bg-white p-6"
    >
      <h3 className="text-lg font-bold text-gray-900 mb-6">Budget Breakdown</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((section, idx) => {
          const { totalBudget, totalActual, leftToSpend } = calculateSection(section.budgets, section.isIncome);
          const Icon = section.icon;
          
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`rounded-xl border-2 border-${section.color}-100 bg-${section.color}-50/30 p-4 cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-xs font-bold tracking-wider text-${section.color}-700`}>
                  {section.title}
                </h4>
                <Icon className={`h-4 w-4 text-${section.color}-500`} />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-500">Budget</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(totalBudget, 'USD')}
                  </span>
                </div>
                
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-500">Actual</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(totalActual, 'USD')}
                  </span>
                </div>
                
                <div className="flex items-baseline justify-between pt-2 border-t border-gray-200">
                  <span className="text-xs font-medium text-gray-600">
                    {section.isIncome ? 'Above' : 'Left'}
                  </span>
                  <span className={`text-sm font-bold ${
                    leftToSpend >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(Math.abs(leftToSpend), 'USD')}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}