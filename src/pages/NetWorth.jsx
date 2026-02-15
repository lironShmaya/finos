import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import StatCard from '../components/shared/StatCard';
import EmptyState from '../components/shared/EmptyState';
import { formatCurrency } from '../components/shared/CurrencyFormatter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, Landmark, CreditCard, Pencil, Trash2, Building } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#111827', '#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#8B5CF6'];

export default function NetWorth() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list(),
  });

  const { data: persons = [] } = useQuery({
    queryKey: ['persons'],
    queryFn: () => base44.entities.Person.list(),
  });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.Account.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accounts'] }); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Account.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accounts'] }); setEditing(null); setShowForm(false); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Account.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });

  const assets = accounts.filter(a => a.is_asset !== false);
  const liabilities = accounts.filter(a => a.is_asset === false);
  const totalAssets = assets.reduce((s, a) => s + (a.current_balance || 0), 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + Math.abs(a.current_balance || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  const pieData = accounts.filter(a => a.is_asset !== false && (a.current_balance || 0) > 0).map(a => ({
    name: a.name,
    value: a.current_balance || 0,
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      name: fd.get('name'),
      type: fd.get('type'),
      institution: fd.get('institution'),
      currency: fd.get('currency') || 'USD',
      current_balance: parseFloat(fd.get('current_balance')) || 0,
      is_asset: fd.get('is_asset') !== 'liability',
      owner_person_id: fd.get('owner_person_id') || '',
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Net Worth" subtitle={formatCurrency(netWorth, 'USD', true)}>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" /> Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Account' : 'New Account'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Account Name</Label>
                  <Input name="name" defaultValue={editing?.name || ''} required placeholder="e.g., Chase Checking" />
                </div>
                <div>
                  <Label>Institution</Label>
                  <Input name="institution" defaultValue={editing?.institution || ''} placeholder="Bank name" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select name="type" defaultValue={editing?.type || 'checking'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="brokerage">Brokerage</SelectItem>
                      <SelectItem value="pension">Pension</SelectItem>
                      <SelectItem value="loan">Loan</SelectItem>
                      <SelectItem value="mortgage">Mortgage</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select name="currency" defaultValue={editing?.currency || 'USD'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="ILS">ILS</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Balance</Label>
                  <Input name="current_balance" type="number" step="0.01" defaultValue={editing?.current_balance || ''} required />
                </div>
              </div>
              <div>
                <Label>Asset / Liability</Label>
                <Select name="is_asset" defaultValue={editing?.is_asset === false ? 'liability' : 'asset'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Owner</Label>
                <Select name="owner_person_id" defaultValue={editing?.owner_person_id || ''}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {persons.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Assets" value={formatCurrency(totalAssets)} icon={TrendingUp} />
        <StatCard title="Total Liabilities" value={formatCurrency(totalLiabilities)} icon={CreditCard} />
        <StatCard title="Net Worth" value={formatCurrency(netWorth)} icon={Landmark} trendUp={netWorth >= 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie chart */}
        {pieData.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Asset Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Accounts list */}
        <div className={`${pieData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {accounts.length === 0 ? (
            <EmptyState
              icon={Building}
              title="No accounts yet"
              description="Add your bank accounts, investments, and debts to track net worth."
              actionLabel="Add Account"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <div className="space-y-6">
              {assets.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Assets</h3>
                  <div className="grid gap-2">
                    {assets.map(a => (
                      <div key={a.id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3 hover:shadow-sm transition-shadow">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{a.name}</p>
                          <p className="text-xs text-gray-400">{a.institution || a.type} · {a.currency}</p>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(a.current_balance, a.currency)}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(a); setShowForm(true); }}>
                          <Pencil className="h-3.5 w-3.5 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(a.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {liabilities.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Liabilities</h3>
                  <div className="grid gap-2">
                    {liabilities.map(a => (
                      <div key={a.id} className="flex items-center gap-4 rounded-xl border border-red-50 bg-white px-4 py-3 hover:shadow-sm transition-shadow">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{a.name}</p>
                          <p className="text-xs text-gray-400">{a.institution || a.type} · {a.currency}</p>
                        </div>
                        <span className="text-sm font-bold text-red-500">-{formatCurrency(Math.abs(a.current_balance), a.currency)}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(a); setShowForm(true); }}>
                          <Pencil className="h-3.5 w-3.5 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(a.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}