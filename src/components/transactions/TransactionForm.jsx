import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

export default function TransactionForm({ transaction, categories, accounts, persons, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    date: '',
    amount: '',
    currency: 'USD',
    type: 'expense',
    category_id: '',
    category_name: '',
    merchant: '',
    description: '',
    account_id: '',
    account_name: '',
    person_id: '',
    person_name: '',
    status: 'cleared',
    ...transaction
  });

  useEffect(() => {
    if (transaction) setForm(prev => ({ ...prev, ...transaction }));
  }, [transaction]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cat = categories.find(c => c.id === form.category_id);
    const acc = accounts.find(a => a.id === form.account_id);
    const per = persons.find(p => p.id === form.person_id);
    onSubmit({
      ...form,
      amount: parseFloat(form.amount),
      category_name: cat?.name || form.category_name,
      account_name: acc?.name || form.account_name,
      person_name: per?.name || form.person_name,
    });
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-900">
          {transaction?.id ? 'Edit Transaction' : 'Add Transaction'}
        </h3>
        <button onClick={onCancel}><X className="h-5 w-5 text-gray-400" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </div>
          <div>
            <Label>Amount</Label>
            <Input type="number" step="0.01" value={form.amount} onChange={(e) => set('amount', e.target.value)} required placeholder="0.00" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => set('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Merchant / Payee</Label>
            <Input value={form.merchant} onChange={(e) => set('merchant', e.target.value)} placeholder="e.g., Amazon" />
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="ILS">ILS (₪)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <Label>Category</Label>
            <Select value={form.category_id} onValueChange={(v) => set('category_id', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Account</Label>
            <Select value={form.account_id} onValueChange={(v) => set('account_id', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Person</Label>
            <Select value={form.person_id} onValueChange={(v) => set('person_id', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {persons.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Optional notes..." />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">{transaction?.id ? 'Update' : 'Add Transaction'}</Button>
        </div>
      </form>
    </div>
  );
}