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
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Target, Pencil, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { format, differenceInMonths } from 'date-fns';

export default function Goals() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.Goal.list(),
  });

  const { data: persons = [] } = useQuery({
    queryKey: ['persons'],
    queryFn: () => base44.entities.Person.list(),
  });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.Goal.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Goal.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); setEditing(null); setShowForm(false); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const person = persons.find(p => p.id === fd.get('person_id'));
    const data = {
      name: fd.get('name'),
      type: fd.get('type') || 'custom',
      target_amount: parseFloat(fd.get('target_amount')),
      current_amount: parseFloat(fd.get('current_amount')) || 0,
      target_date: fd.get('target_date') || '',
      monthly_contribution: parseFloat(fd.get('monthly_contribution')) || 0,
      expected_return: parseFloat(fd.get('expected_return')) || 0,
      currency: fd.get('currency') || 'USD',
      person_id: fd.get('person_id') || '',
      person_name: person?.name || '',
      priority: parseInt(fd.get('priority')) || 3,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  const getETA = (goal) => {
    if (!goal.monthly_contribution || goal.monthly_contribution <= 0) return null;
    const remaining = goal.target_amount - (goal.current_amount || 0);
    if (remaining <= 0) return 'Achieved!';
    const months = Math.ceil(remaining / goal.monthly_contribution);
    if (months <= 12) return `~${months} months`;
    return `~${(months / 12).toFixed(1)} years`;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Goals" subtitle={`${goals.length} goals`}>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Goal' : 'New Goal'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Goal Name</Label><Input name="name" defaultValue={editing?.name || ''} required placeholder="Emergency fund" /></div>
                <div>
                  <Label>Type</Label>
                  <Select name="type" defaultValue={editing?.type || 'custom'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency_fund">Emergency Fund</SelectItem>
                      <SelectItem value="house_down_payment">House Down Payment</SelectItem>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="retirement">Retirement</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Target Amount</Label><Input name="target_amount" type="number" step="0.01" defaultValue={editing?.target_amount || ''} required /></div>
                <div><Label>Current Amount</Label><Input name="current_amount" type="number" step="0.01" defaultValue={editing?.current_amount || 0} /></div>
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
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Monthly Contribution</Label><Input name="monthly_contribution" type="number" step="0.01" defaultValue={editing?.monthly_contribution || ''} /></div>
                <div><Label>Expected Return %</Label><Input name="expected_return" type="number" step="0.1" defaultValue={editing?.expected_return || ''} /></div>
                <div><Label>Target Date</Label><Input name="target_date" type="date" defaultValue={editing?.target_date || ''} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority (1-5)</Label>
                  <Select name="priority" defaultValue={String(editing?.priority || 3)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Person</Label>
                  <Select name="person_id" defaultValue={editing?.person_id || ''}>
                    <SelectTrigger><SelectValue placeholder="Household" /></SelectTrigger>
                    <SelectContent>
                      {persons.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Set financial goals and track your progress towards achieving them." actionLabel="Create Goal" onAction={() => setShowForm(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.sort((a,b) => (a.priority || 3) - (b.priority || 3)).map(goal => {
            const pct = goal.target_amount > 0 ? Math.min(100, ((goal.current_amount || 0) / goal.target_amount) * 100) : 0;
            const eta = getETA(goal);
            return (
              <div key={goal.id} className="rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">{goal.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{goal.type?.replace(/_/g, ' ')}</span>
                      {goal.person_name && <span className="text-xs text-gray-400">· {goal.person_name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(goal); setShowForm(true); }}>
                      <Pencil className="h-3.5 w-3.5 text-gray-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(goal.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                    </Button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-end justify-between mb-1.5">
                    <span className="text-2xl font-bold text-gray-900">{pct.toFixed(0)}%</span>
                    <span className="text-sm text-gray-500">{formatCurrency(goal.current_amount || 0, goal.currency)} / {formatCurrency(goal.target_amount, goal.currency)}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  {goal.monthly_contribution > 0 && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {formatCurrency(goal.monthly_contribution, goal.currency)}/mo
                    </span>
                  )}
                  {goal.target_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(goal.target_date), 'MMM yyyy')}
                    </span>
                  )}
                  {eta && <span className="ml-auto font-medium text-gray-500">{eta}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}