import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import { formatCurrency } from '../components/shared/CurrencyFormatter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, PieChart, Pencil, Trash2 } from 'lucide-react';

export default function Budgets() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date', 500),
  });

  // Real-time auto-updates
  useEffect(() => {
    const unsubscribeBudget = base44.entities.Budget.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    });

    const unsubscribeTx = base44.entities.Transaction.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    });

    return () => {
      unsubscribeBudget();
      unsubscribeTx();
    };
  }, [queryClient]);

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.Budget.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['budgets'] }); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Budget.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['budgets'] }); setEditing(null); setShowForm(false); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Budget.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });

  const now = new Date();
  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense';
  });

  const getSpent = (catId, catName) => {
    return thisMonthTx
      .filter(t => t.category_id === catId || t.category_name === catName)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const cat = categories.find(c => c.id === fd.get('category_id'));
    const data = {
      category_id: fd.get('category_id'),
      category_name: cat?.name || '',
      amount: parseFloat(fd.get('amount')),
      period: fd.get('period') || 'monthly',
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Budgets" subtitle={now.toLocaleString('default', { month: 'long', year: 'numeric' })}>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" /> Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Budget' : 'New Budget'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select name="category_id" defaultValue={editing?.category_id || ''}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Monthly Budget Amount</Label>
                <Input name="amount" type="number" step="0.01" defaultValue={editing?.amount || ''} required placeholder="0.00" />
              </div>
              <div>
                <Label>Period</Label>
                <Select name="period" defaultValue={editing?.period || 'monthly'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {budgets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="No budgets yet"
          description="Create category budgets to track your spending against targets."
          actionLabel="Add Budget"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-gray-400 px-6 py-4">Category</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-gray-400 px-6 py-4">Period</th>
                  <th className="text-right text-xs font-medium uppercase tracking-wider text-gray-400 px-6 py-4">Budget</th>
                  <th className="text-right text-xs font-medium uppercase tracking-wider text-gray-400 px-6 py-4">Spent</th>
                  <th className="text-right text-xs font-medium uppercase tracking-wider text-gray-400 px-6 py-4">Remaining</th>
                  <th className="text-center text-xs font-medium uppercase tracking-wider text-gray-400 px-6 py-4">Progress</th>
                  <th className="text-right text-xs font-medium uppercase tracking-wider text-gray-400 px-6 py-4 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {budgets.map(b => {
                  const spent = getSpent(b.category_id, b.category_name);
                  const pct = b.amount > 0 ? Math.min(100, (spent / b.amount) * 100) : 0;
                  const isOver = spent > b.amount;
                  const remaining = b.amount - spent;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <span className="text-sm font-semibold text-gray-900">{b.category_name || 'Unknown'}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-gray-600 capitalize">{b.period}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(b.amount)}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`text-sm font-semibold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatCurrency(spent)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`text-sm font-semibold ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>
                          {isOver ? `-${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <Progress value={pct} className={`h-2 flex-1 ${isOver ? '[&>div]:bg-red-500' : ''}`} />
                          <span className={`text-xs font-medium ${isOver ? 'text-red-600' : 'text-gray-600'} min-w-[40px] text-right`}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(b); setShowForm(true); }}>
                            <Pencil className="h-3.5 w-3.5 text-gray-400" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(b.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}