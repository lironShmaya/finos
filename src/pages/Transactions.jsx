import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import TransactionTable from '../components/transactions/TransactionTable';
import TransactionForm from '../components/transactions/TransactionForm';
import ImportExcel from '../components/transactions/ImportExcel';
import EmptyState from '../components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Upload, Search, ArrowRightLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Transactions() {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date', 500),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list(),
  });

  const { data: persons = [] } = useQuery({
    queryKey: ['persons'],
    queryFn: () => base44.entities.Person.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); setShowForm(false); setEditingTx(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Transaction.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); setShowForm(false); setEditingTx(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Transaction.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const handleSubmit = (data) => {
    if (editingTx?.id) {
      updateMutation.mutate({ id: editingTx.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = transactions.filter(t => {
    const matchesSearch = !search || 
      (t.merchant || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.category_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" subtitle={`${transactions.length} total`}>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => { setShowImport(true); setShowForm(false); }}>
          <Upload className="h-4 w-4" />
          Import
        </Button>
        <Button size="sm" className="gap-2" onClick={() => { setShowForm(true); setShowImport(false); setEditingTx(null); }}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </PageHeader>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <TransactionForm
              transaction={editingTx}
              categories={categories}
              accounts={accounts}
              persons={persons}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingTx(null); }}
            />
          </motion.div>
        )}
        {showImport && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <ImportExcel
              onImportComplete={() => { setShowImport(false); queryClient.invalidateQueries({ queryKey: ['transactions'] }); }}
              onCancel={() => setShowImport(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="transfer">Transfers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState
          icon={ArrowRightLeft}
          title="No transactions yet"
          description="Add your first transaction or import from an Excel file to get started."
          actionLabel="Add Transaction"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <TransactionTable
          transactions={filtered}
          onEdit={(t) => { setEditingTx(t); setShowForm(true); }}
          onDelete={(t) => deleteMutation.mutate(t.id)}
        />
      )}
    </div>
  );
}