import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import { formatCurrency } from '../components/shared/CurrencyFormatter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Receipt, Calendar, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { format, addMonths, addWeeks, addYears, addDays } from 'date-fns';

export default function Bills() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: bills = [] } = useQuery({
    queryKey: ['bills'],
    queryFn: () => base44.entities.Bill.list(),
  });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.Bill.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bills'] }); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Bill.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bills'] }); setEditing(null); setShowForm(false); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Bill.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bills'] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      name: fd.get('name'),
      provider: fd.get('provider'),
      amount: parseFloat(fd.get('amount')),
      currency: fd.get('currency') || 'USD',
      frequency: fd.get('frequency') || 'monthly',
      due_day: parseInt(fd.get('due_day')) || 1,
      is_autopay: fd.get('is_autopay') === 'on',
      is_active: true,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  const totalMonthly = bills.filter(b => b.is_active !== false).reduce((s, b) => {
    const amt = b.amount || 0;
    if (b.frequency === 'annually') return s + amt / 12;
    if (b.frequency === 'quarterly') return s + amt / 3;
    if (b.frequency === 'weekly') return s + amt * 4.33;
    if (b.frequency === 'biweekly') return s + amt * 2.17;
    return s + amt;
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Bills & Subscriptions" subtitle={`${formatCurrency(totalMonthly)}/mo total`}>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" /> Add Bill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Bill' : 'New Bill'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input name="name" defaultValue={editing?.name || ''} required placeholder="e.g., Netflix" />
                </div>
                <div>
                  <Label>Provider</Label>
                  <Input name="provider" defaultValue={editing?.provider || ''} placeholder="Company" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Amount</Label>
                  <Input name="amount" type="number" step="0.01" defaultValue={editing?.amount || ''} required />
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
                  <Label>Due Day</Label>
                  <Input name="due_day" type="number" min="1" max="31" defaultValue={editing?.due_day || 1} />
                </div>
              </div>
              <div>
                <Label>Frequency</Label>
                <Select name="frequency" defaultValue={editing?.frequency || 'monthly'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
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

      {bills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No bills tracked"
          description="Add your recurring bills and subscriptions to stay on top of payments."
          actionLabel="Add Bill"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid gap-3">
          {bills.map(b => (
            <div key={b.id} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 hover:shadow-sm transition-shadow">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50">
                <Receipt className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{b.name}</p>
                <p className="text-xs text-gray-400">{b.provider || b.frequency} · Due on {b.due_day || '—'}th</p>
              </div>
              <div className="flex items-center gap-3">
                {b.is_autopay && <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Auto-pay</Badge>}
                <Badge variant="outline" className="text-xs">{b.frequency}</Badge>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(b.amount, b.currency)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(b); setShowForm(true); }}>
                  <Pencil className="h-3.5 w-3.5 text-gray-400" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(b.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}