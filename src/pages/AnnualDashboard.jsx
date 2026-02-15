import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import StatCard from '../components/shared/StatCard';
import { formatCurrency } from '../components/shared/CurrencyFormatter';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Receipt, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#6366F1'];

export default function AnnualDashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['bills'],
    queryFn: () => base44.entities.Bill.list(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ['holdings'],
    queryFn: () => base44.entities.Holding.list(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-date'),
  });

  // Filter transactions for selected year
  const yearTransactions = transactions.filter(t => {
    const year = new Date(t.date).getFullYear();
    return year === selectedYear;
  });

  const income = yearTransactions.filter(t => t.type === 'income');
  const expenses = yearTransactions.filter(t => t.type === 'expense');

  const totalIncome = income.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalSavings = totalIncome - totalExpenses;

  // Monthly aggregation
  const monthlyData = {};
  for (let m = 0; m < 12; m++) {
    const monthName = new Date(selectedYear, m, 1).toLocaleString('en', { month: 'short' });
    monthlyData[monthName] = { month: monthName, income: 0, expense: 0, bills: 0 };
  }

  yearTransactions.forEach(t => {
    const monthName = new Date(t.date).toLocaleString('en', { month: 'short' });
    if (monthlyData[monthName]) {
      if (t.type === 'income') {
        monthlyData[monthName].income += Math.abs(t.amount);
      } else if (t.type === 'expense') {
        monthlyData[monthName].expense += Math.abs(t.amount);
      }
    }
  });

  const monthlyChartData = Object.values(monthlyData);

  // Income by category
  const incomeByCategory = {};
  income.forEach(t => {
    const cat = t.category_name || 'Other';
    incomeByCategory[cat] = (incomeByCategory[cat] || 0) + Math.abs(t.amount);
  });
  const incomePieData = Object.entries(incomeByCategory).map(([name, value]) => ({ name, value }));

  // Expense by category
  const expenseByCategory = {};
  expenses.forEach(t => {
    const cat = t.category_name || 'Other';
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Math.abs(t.amount);
  });
  const expensePieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  // Monthly stats
  const monthlyIncome = monthlyChartData.map(m => m.income);
  const monthlyExpense = monthlyChartData.map(m => m.expense);
  const avgMonthlyIncome = monthlyIncome.reduce((a, b) => a + b, 0) / 12;
  const avgMonthlyExpense = monthlyExpense.reduce((a, b) => a + b, 0) / 12;
  const maxIncomeMonth = monthlyChartData.reduce((max, m) => m.income > max.income ? m : max, { income: 0, month: 'N/A' });
  const minIncomeMonth = monthlyChartData.filter(m => m.income > 0).reduce((min, m) => m.income < min.income ? m : min, { income: Infinity, month: 'N/A' });
  const maxExpenseMonth = monthlyChartData.reduce((max, m) => m.expense > max.expense ? m : max, { expense: 0, month: 'N/A' });
  const minExpenseMonth = monthlyChartData.filter(m => m.expense > 0).reduce((min, m) => m.expense < min.expense ? m : min, { expense: Infinity, month: 'N/A' });

  // Calculate Bills Summary
  const yearBills = bills.reduce((total, bill) => {
    if (bill.is_active) {
      const frequency = bill.frequency || 'monthly';
      const multiplier = {
        weekly: 52,
        biweekly: 26,
        monthly: 12,
        quarterly: 4,
        annually: 1
      }[frequency] || 12;
      return total + (bill.amount * multiplier);
    }
    return total;
  }, 0);

  // Calculate debt paid from transactions
  const debtCategories = categories.filter(c => c.type === 'debt').map(c => c.id);
  const debtPaid = yearTransactions
    .filter(t => t.type === 'expense' && debtCategories.includes(t.category_id))
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  // Investment data for selected year
  const yearOrders = orders.filter(o => {
    const year = new Date(o.date).getFullYear();
    return year === selectedYear;
  });

  const totalInvested = yearOrders
    .filter(o => o.order_type === 'buy')
    .reduce((s, o) => s + (o.quantity * o.price), 0);

  const totalDivested = yearOrders
    .filter(o => o.order_type === 'sell')
    .reduce((s, o) => s + (o.quantity * o.price), 0);

  const totalPortfolioValue = holdings.reduce((s, h) => s + (h.market_value || h.quantity * h.current_price || 0), 0);
  const totalPortfolioCost = holdings.reduce((s, h) => s + (h.quantity * h.avg_cost || 0), 0);
  const totalPortfolioPL = totalPortfolioValue - totalPortfolioCost;

  return (
    <div className="space-y-6">
      <PageHeader title={`Annual Dashboard ${selectedYear}`} subtitle="Yearly financial overview">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setSelectedYear(selectedYear - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold px-3">{selectedYear}</span>
          <Button size="sm" variant="outline" onClick={() => setSelectedYear(selectedYear + 1)} disabled={selectedYear >= new Date().getFullYear()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Annual Total Income" value={formatCurrency(totalIncome, 'USD')} icon={TrendingUp} />
        <StatCard title="Annual Total Expenses" value={formatCurrency(totalExpenses, 'USD')} icon={TrendingDown} />
        <StatCard title="Annual Total Bills" value={formatCurrency(yearBills, 'USD')} icon={Receipt} />
        <StatCard title="Total Debt Paid" value={formatCurrency(debtPaid, 'USD')} icon={DollarSign} />
        <StatCard title="Annual Savings" value={formatCurrency(totalSavings, 'USD')} icon={Target} />
      </div>

      {/* Income Summary */}
      <div className="rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-950 to-gray-900 p-6">
        <h2 className="text-2xl font-bold text-emerald-400 mb-6 text-center">INCOME SUMMARY</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-emerald-500/30">
            <p className="text-xs text-emerald-400 uppercase mb-2">Total Income This Year</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalIncome, 'USD')}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-emerald-500/30">
            <p className="text-xs text-emerald-400 uppercase mb-2">Average Monthly Income</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(avgMonthlyIncome, 'USD')}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-emerald-500/30">
            <p className="text-xs text-emerald-400 uppercase mb-2">Highest Income Month</p>
            <p className="text-2xl font-bold text-emerald-400">{maxIncomeMonth.month}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-emerald-500/30">
            <p className="text-xs text-emerald-400 uppercase mb-2">Lowest Income Month</p>
            <p className="text-2xl font-bold text-emerald-400">{minIncomeMonth.month !== 'N/A' ? minIncomeMonth.month : 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800/30 rounded-xl p-4 border border-emerald-500/30">
            <h3 className="text-sm font-semibold text-emerald-400 mb-4 text-center">MONTHLY INCOME TOTAL</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#10B981" fontSize={12} />
                <YAxis stroke="#10B981" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #10B981' }} />
                <Bar dataKey="income" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-4 border border-emerald-500/30">
            <h3 className="text-sm font-semibold text-emerald-400 mb-4 text-center">INCOME BREAKDOWN</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={incomePieData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={90}>
                  {incomePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #10B981' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-xl p-4 border border-emerald-500/30">
          <h3 className="text-sm font-semibold text-emerald-400 mb-4 text-center">INCOME vs EXPENSE</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#10B981" fontSize={12} />
              <YAxis stroke="#10B981" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #10B981' }} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} name="Expense" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Summary */}
      <div className="rounded-2xl border-2 border-pink-500 bg-gradient-to-br from-pink-950 to-gray-900 p-6">
        <h2 className="text-2xl font-bold text-pink-400 mb-6 text-center">EXPENSE SUMMARY</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-pink-500/30">
            <p className="text-xs text-pink-400 uppercase mb-2">Total Expenses This Year</p>
            <p className="text-2xl font-bold text-pink-400">{formatCurrency(totalExpenses, 'USD')}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-pink-500/30">
            <p className="text-xs text-pink-400 uppercase mb-2">Average Monthly Expense</p>
            <p className="text-2xl font-bold text-pink-400">{formatCurrency(avgMonthlyExpense, 'USD')}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-pink-500/30">
            <p className="text-xs text-pink-400 uppercase mb-2">Highest Expense Month</p>
            <p className="text-2xl font-bold text-pink-400">{maxExpenseMonth.month}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-pink-500/30">
            <p className="text-xs text-pink-400 uppercase mb-2">Lowest Expense Month</p>
            <p className="text-2xl font-bold text-pink-400">{minExpenseMonth.month !== 'N/A' ? minExpenseMonth.month : 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800/30 rounded-xl p-4 border border-pink-500/30">
            <h3 className="text-sm font-semibold text-pink-400 mb-4 text-center">MONTHLY EXPENSE TOTAL</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#EC4899" fontSize={12} />
                <YAxis stroke="#EC4899" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #EC4899' }} />
                <Bar dataKey="expense" fill="#EC4899" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-4 border border-pink-500/30">
            <h3 className="text-sm font-semibold text-pink-400 mb-4 text-center">EXPENSE BREAKDOWN</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={expensePieData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={90}>
                  {expensePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #EC4899' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Investment Summary */}
      <div className="rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-950 to-gray-900 p-6">
        <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">INVESTMENT SUMMARY</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-blue-500/30">
            <p className="text-xs text-blue-400 uppercase mb-2">Total Invested This Year</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalInvested, 'USD')}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-blue-500/30">
            <p className="text-xs text-blue-400 uppercase mb-2">Total Divested This Year</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalDivested, 'USD')}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-blue-500/30">
            <p className="text-xs text-blue-400 uppercase mb-2">Current Portfolio Value</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalPortfolioValue, 'USD')}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-blue-500/30">
            <p className="text-xs text-blue-400 uppercase mb-2">Total Portfolio P/L</p>
            <p className={`text-2xl font-bold ${totalPortfolioPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalPortfolioPL >= 0 ? '+' : ''}{formatCurrency(totalPortfolioPL, 'USD')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800/30 rounded-xl p-4 border border-blue-500/30">
            <h3 className="text-sm font-semibold text-blue-400 mb-4 text-center">YEARLY ORDERS</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { type: 'Invested', value: totalInvested },
                { type: 'Divested', value: totalDivested }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="type" stroke="#3B82F6" fontSize={12} />
                <YAxis stroke="#3B82F6" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #3B82F6' }} />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-4 border border-blue-500/30">
            <h3 className="text-sm font-semibold text-blue-400 mb-4 text-center">PORTFOLIO PERFORMANCE</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { metric: 'Cost', value: totalPortfolioCost },
                { metric: 'Value', value: totalPortfolioValue }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="metric" stroke="#3B82F6" fontSize={12} />
                <YAxis stroke="#3B82F6" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #3B82F6' }} />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}