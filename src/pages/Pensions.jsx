import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Landmark, Pencil, Trash2, Upload, FileText, Shield } from 'lucide-react';
import UploadMasleka from '../components/pensions/UploadMasleka';

export default function Pensions() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: plans = [] } = useQuery({
    queryKey: ['pensionPlans'],
    queryFn: () => base44.entities.PensionPlan.list(),
  });

  const { data: persons = [] } = useQuery({
    queryKey: ['persons'],
    queryFn: () => base44.entities.Person.list(),
  });

  // Real-time auto-updates
  useEffect(() => {
    const unsubscribe = base44.entities.PensionPlan.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['pensionPlans'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.PensionPlan.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pensionPlans'] }); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PensionPlan.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pensionPlans'] }); setEditing(null); setShowForm(false); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.PensionPlan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pensionPlans'] }),
  });

  const totalValue = plans.reduce((s, p) => s + (p.current_value || 0), 0);
  const activePlans = plans.filter(p => p.status !== 'inactive');

  const typeColors = {
    pension: 'bg-blue-50 text-blue-700 border-blue-200',
    hishtalmut: 'bg-purple-50 text-purple-700 border-purple-200',
    gemel: 'bg-green-50 text-green-700 border-green-200',
    insurance: 'bg-orange-50 text-orange-700 border-orange-200',
    other: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const person = persons.find(p => p.id === fd.get('person_id'));
    const data = {
      provider: fd.get('provider'),
      plan_name: fd.get('plan_name'),
      product_type: fd.get('product_type'),
      policy_number: fd.get('policy_number'),
      currency: fd.get('currency') || 'ILS',
      current_value: parseFloat(fd.get('current_value')) || 0,
      person_id: fd.get('person_id') || '',
      person_name: person?.name || '',
      status: fd.get('status') || 'active',
      management_fee_deposits: parseFloat(fd.get('management_fee_deposits')) || 0,
      management_fee_assets: parseFloat(fd.get('management_fee_assets')) || 0,
      investment_track: fd.get('investment_track') || '',
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Pensions" subtitle={`${activePlans.length} active plans`}>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" /> Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Plan' : 'Add Pension Plan'}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="upload">Upload Masleka</TabsTrigger>
              </TabsList>
              <TabsContent value="manual" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Provider</Label><Input name="provider" defaultValue={editing?.provider || ''} required placeholder="Migdal, Menora..." /></div>
                <div><Label>Plan Name</Label><Input name="plan_name" defaultValue={editing?.plan_name || ''} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product Type</Label>
                  <Select name="product_type" defaultValue={editing?.product_type || 'pension'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pension">Pension</SelectItem>
                      <SelectItem value="hishtalmut">Keren Hishtalmut</SelectItem>
                      <SelectItem value="gemel">Kupat Gemel</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Person</Label>
                  <Select name="person_id" defaultValue={editing?.person_id || ''}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {persons.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Current Value</Label><Input name="current_value" type="number" step="0.01" defaultValue={editing?.current_value || ''} /></div>
                <div>
                  <Label>Currency</Label>
                  <Select name="currency" defaultValue={editing?.currency || 'ILS'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ILS">ILS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editing?.status || 'active'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="frozen">Frozen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Fee % (Deposits)</Label><Input name="management_fee_deposits" type="number" step="0.01" defaultValue={editing?.management_fee_deposits || ''} /></div>
                <div><Label>Fee % (Assets)</Label><Input name="management_fee_assets" type="number" step="0.01" defaultValue={editing?.management_fee_assets || ''} /></div>
              </div>
              <div><Label>Investment Track</Label><Input name="investment_track" defaultValue={editing?.investment_track || ''} placeholder="General, S&P 500..." /></div>
              <div><Label>Policy Number</Label><Input name="policy_number" defaultValue={editing?.policy_number || ''} /></div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
              </div>
            </form>
              </TabsContent>
              <TabsContent value="upload" className="mt-4">
                <UploadMasleka onComplete={(data) => {
                  console.log('Extracted data:', data);
                  setShowForm(false);
                  queryClient.invalidateQueries({ queryKey: ['pensionPlans'] });
                }} />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Pension Value" value={formatCurrency(totalValue, 'ILS')} icon={Shield} />
        <StatCard title="Active Plans" value={activePlans.length} icon={Landmark} />
        <StatCard title="Providers" value={[...new Set(plans.map(p => p.provider))].length} icon={FileText} />
      </div>

      {plans.length === 0 ? (
        <EmptyState icon={Landmark} title="No pension plans" description="Add your pension plans to track their value and performance." actionLabel="Add Plan" onAction={() => setShowForm(true)} />
      ) : (
        <div className="grid gap-3">
          {plans.map(p => (
            <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 hover:shadow-sm transition-shadow">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50">
                <Landmark className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{p.plan_name}</p>
                  <Badge variant="outline" className={`text-xs ${typeColors[p.product_type] || typeColors.other}`}>{p.product_type}</Badge>
                  {p.status === 'inactive' && <Badge variant="outline" className="text-xs bg-gray-50">Inactive</Badge>}
                </div>
                <p className="text-xs text-gray-400">{p.provider} {p.person_name ? `· ${p.person_name}` : ''}</p>
              </div>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(p.current_value, p.currency)}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(p); setShowForm(true); }}>
                <Pencil className="h-3.5 w-3.5 text-gray-400" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(p.id)}>
                <Trash2 className="h-3.5 w-3.5 text-gray-400" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}