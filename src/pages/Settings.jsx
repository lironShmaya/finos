import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import { formatCurrency } from '../components/shared/CurrencyFormatter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Tag, Settings as SettingsIcon, Pencil, Trash2, RefreshCw, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const queryClient = useQueryClient();
  const [updatingRates, setUpdatingRates] = useState(false);

  const handleUpdateExchangeRates = async () => {
    setUpdatingRates(true);
    try {
      const { data } = await base44.functions.invoke('updateAllExchangeRates', {});
      toast.success(`Updated ${data.updated} exchange rates`);
      queryClient.invalidateQueries({ queryKey: ['fxrates'] });
    } catch (error) {
      toast.error('Failed to update rates: ' + error.message);
    } finally {
      setUpdatingRates(false);
    }
  };

  // Persons
  const { data: persons = [] } = useQuery({ queryKey: ['persons'], queryFn: () => base44.entities.Person.list() });
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const createPersonMut = useMutation({
    mutationFn: (d) => base44.entities.Person.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['persons'] }); setShowPersonForm(false); },
  });
  const updatePersonMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Person.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['persons'] }); setEditingPerson(null); setShowPersonForm(false); },
  });
  const deletePersonMut = useMutation({
    mutationFn: (id) => base44.entities.Person.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['persons'] }),
  });

  // Categories
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => base44.entities.Category.list() });
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const createCatMut = useMutation({
    mutationFn: (d) => base44.entities.Category.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setShowCatForm(false); },
  });
  const updateCatMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Category.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setEditingCat(null); setShowCatForm(false); },
  });
  const deleteCatMut = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const handlePersonSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = { name: fd.get('name'), relationship: fd.get('relationship'), notes: fd.get('notes') || '' };
    if (editingPerson) updatePersonMut.mutate({ id: editingPerson.id, data });
    else createPersonMut.mutate(data);
  };

  const handleCatSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = { name: fd.get('name'), type: fd.get('type'), section: fd.get('section'), color: fd.get('color') || '#6B7280' };
    if (editingCat) updateCatMut.mutate({ id: editingCat.id, data });
    else createCatMut.mutate(data);
  };

  const typeColors = {
    essentials: 'bg-blue-50 text-blue-700',
    discretionary: 'bg-purple-50 text-purple-700',
    investment: 'bg-green-50 text-green-700',
    bills: 'bg-orange-50 text-orange-700',
    debt: 'bg-red-50 text-red-700',
    income: 'bg-emerald-50 text-emerald-700',
    transfer: 'bg-gray-50 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your financial system" />

      <Tabs defaultValue="persons" className="space-y-6">
        <TabsList>
          <TabsTrigger value="persons" className="gap-2"><Users className="h-4 w-4" /> People</TabsTrigger>
          <TabsTrigger value="categories" className="gap-2"><Tag className="h-4 w-4" /> Categories</TabsTrigger>
          <TabsTrigger value="currency" className="gap-2"><DollarSign className="h-4 w-4" /> Currency</TabsTrigger>
        </TabsList>

        <TabsContent value="persons">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Household members for attribution</p>
              <Dialog open={showPersonForm} onOpenChange={setShowPersonForm}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2" onClick={() => setEditingPerson(null)}>
                    <Plus className="h-4 w-4" /> Add Person
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingPerson ? 'Edit Person' : 'Add Person'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handlePersonSubmit} className="space-y-4">
                    <div><Label>Name</Label><Input name="name" defaultValue={editingPerson?.name || ''} required /></div>
                    <div>
                      <Label>Relationship</Label>
                      <Select name="relationship" defaultValue={editingPerson?.relationship || 'self'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self">Self</SelectItem>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Notes</Label><Input name="notes" defaultValue={editingPerson?.notes || ''} /></div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setShowPersonForm(false)}>Cancel</Button>
                      <Button type="submit">{editingPerson ? 'Update' : 'Create'}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-2">
              {persons.map(p => (
                <div key={p.id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                    {p.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.relationship}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingPerson(p); setShowPersonForm(true); }}>
                    <Pencil className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deletePersonMut.mutate(p.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                </div>
              ))}
              {persons.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No household members added yet</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Spending and income categories</p>
              <Dialog open={showCatForm} onOpenChange={setShowCatForm}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2" onClick={() => setEditingCat(null)}>
                    <Plus className="h-4 w-4" /> Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCat ? 'Edit Category' : 'Add Category'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCatSubmit} className="space-y-4">
                    <div><Label>Name</Label><Input name="name" defaultValue={editingCat?.name || ''} required /></div>
                    <div>
                      <Label>Section</Label>
                      <select name="section" defaultValue={editingCat?.section || 'expenses'} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                        <option value="income">Income</option>
                        <option value="expenses">Expenses</option>
                        <option value="bills">Bills</option>
                        <option value="subscriptions">Subscriptions</option>
                        <option value="savings">Savings</option>
                      </select>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expenses">Expenses</SelectItem>
                          <SelectItem value="bills">Bills</SelectItem>
                          <SelectItem value="subscriptions">Subscriptions</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select name="type" defaultValue={editingCat?.type || 'essentials'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="essentials">Essentials</SelectItem>
                          <SelectItem value="discretionary">Discretionary</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                          <SelectItem value="bills">Bills</SelectItem>
                          <SelectItem value="debt">Debt</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Color</Label><Input name="color" type="color" defaultValue={editingCat?.color || '#6B7280'} /></div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setShowCatForm(false)}>Cancel</Button>
                      <Button type="submit">{editingCat ? 'Update' : 'Create'}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-2">
              {categories.map(c => (
                <div key={c.id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color || '#6B7280' }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.section || 'expenses'}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${typeColors[c.type] || ''}`}>{c.type}</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCat(c); setShowCatForm(true); }}>
                    <Pencil className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteCatMut.mutate(c.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No categories added yet</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="currency">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Exchange Rates</p>
                <p className="text-xs text-gray-500 mt-1">Update real-time currency exchange rates</p>
              </div>
              <Button 
                size="sm" 
                className="gap-2" 
                onClick={handleUpdateExchangeRates}
                disabled={updatingRates}
              >
                <RefreshCw className={`h-4 w-4 ${updatingRates ? 'animate-spin' : ''}`} />
                {updatingRates ? 'Updating...' : 'Update Rates'}
              </Button>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6">
              <p className="text-sm text-gray-600">
                Click "Update Rates" to fetch the latest exchange rates for USD/ILS, EUR/USD, GBP/USD and other currency pairs. 
                This will update all transactions, net worth calculations, and investment values with current rates.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}