import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import PageHeader from '../components/shared/PageHeader';
import MonthSnapshot from '../components/dashboard/MonthSnapshot';
import BudgetBreakdown from '../components/dashboard/BudgetBreakdown';
import TopCategories from '../components/dashboard/TopCategories';
import NetWorthTrend from '../components/dashboard/NetWorthTrend';
import GoalsProgress from '../components/dashboard/GoalsProgress';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date', 500),
  });

  const { data: accounts = [], isLoading: accLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list(),
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.Goal.list(),
  });

  // Real-time subscriptions for auto-updates
  useEffect(() => {
    const unsubscribeTx = base44.entities.Transaction.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    });

    const unsubscribeAcc = base44.entities.Account.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    });

    const unsubscribeBudget = base44.entities.Budget.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    });

    const unsubscribeGoal = base44.entities.Goal.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    });

    return () => {
      unsubscribeTx();
      unsubscribeAcc();
      unsubscribeBudget();
      unsubscribeGoal();
    };
  }, [queryClient]);

  const isLoading = txLoading || accLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader title="Dashboard" subtitle={monthName} />
      
      <MonthSnapshot transactions={transactions} />

      <BudgetBreakdown budgets={budgets} transactions={transactions} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopCategories transactions={transactions} budgets={budgets} />
        <NetWorthTrend accounts={accounts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions transactions={transactions} />
        <GoalsProgress goals={goals} />
      </div>
    </motion.div>
  );
}