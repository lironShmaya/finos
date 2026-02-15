import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import { formatCurrency } from '../components/shared/CurrencyFormatter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, PieChart, Pencil, Trash2, ChevronLeft, ChevronRight, DollarSign, TrendingDown, Receipt, PiggyBank, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function Budgets() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
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

  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear() && t.type === 'expense';
  });

  const getSpent = (catId, catName) => {
    return thisMonthTx
      .filter(t => t.category_id === catId || t.category_name === catName)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
  };

  const goToPrevMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedMonth(newDate);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const cat = categories.find(c => c.id === fd.get('category_id'));
    const data = {
      item_name: fd.get('item_name'),
      section: fd.get('section'),
      category_id: fd.get('category_id') || null,
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

  const sections = [
    {
      title: 'INCOME',
      icon: DollarSign,
      color: 'emerald',
      borderColor: 'border-emerald-200',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      budgets: budgets.filter(b => b.section === 'income').sort((a, b) => (a.ordering || 0) - (b.ordering || 0))
    },
    {
      title: 'EXPENSES',
      icon: TrendingDown,
      color: 'rose',
      borderColor: 'border-rose-200',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-700',
      budgets: budgets.filter(b => b.section === 'expenses').sort((a, b) => (a.ordering || 0) - (b.ordering || 0))
    },
    {
      title: 'BILLS',
      icon: Receipt,
      color: 'blue',
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      budgets: budgets.filter(b => b.section === 'bills').sort((a, b) => (a.ordering || 0) - (b.ordering || 0))
    },
    {
      title: 'SUBSCRIPTIONS',
      icon: Receipt,
      color: 'amber',
      borderColor: 'border-amber-200',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      budgets: budgets.filter(b => b.section === 'subscriptions').sort((a, b) => (a.ordering || 0) - (b.ordering || 0))
    },
    {
      title: 'SAVINGS',
      icon: PiggyBank,
      color: 'purple',
      borderColor: 'border-purple-200',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      budgets: budgets.filter(b => b.section === 'savings').sort((a, b) => (a.ordering || 0) - (b.ordering || 0))
    }
  ];

  const handleDragEnd = async (result, sectionBudgets) => {
    if (!result.destination) return;
    
    const items = Array.from(sectionBudgets);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    
    // Update ordering for all items
    for (let i = 0; i < items.length; i++) {
      await base44.entities.Budget.update(items[i].id, { ordering: i });
    }
    
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
  };

  const renderBudgetTable = (sectionBudgets, sectionColor) => {
    if (sectionBudgets.length === 0) return null;
    
    const totalBudget = sectionBudgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = sectionBudgets.reduce((s, b) => s + getSpent(b.category_id, b.category_name), 0);
    
    return (
      <div className="overflow-x-auto">
        <DragDropContext onDragEnd={(result) => handleDragEnd(result, sectionBudgets)}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="w-8"></th>
                <th className="text-left text-xs font-medium uppercase tracking-wider text-gray-400 px-4 py-3">Category</th>
                <th className="text-right text-xs font-medium uppercase tracking-wider text-gray-400 px-4 py-3">Budget</th>
                <th className="text-right text-xs font-medium uppercase tracking-wider text-gray-400 px-4 py-3">Actual</th>
                <th className="text-right text-xs font-medium uppercase tracking-wider text-gray-400 px-4 py-3">Left</th>
                <th className="text-center text-xs font-medium uppercase tracking-wider text-gray-400 px-4 py-3 w-32">Progress</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <Droppable droppableId="budget-table">
              {(provided) => (
                <tbody className="divide-y divide-gray-100" {...provided.droppableProps} ref={provided.innerRef}>
                  {sectionBudgets.map((b, idx) => {
                    const spent = getSpent(b.category_id, b.category_name);
                    const pct = b.amount > 0 ? Math.min(100, (spent / b.amount) * 100) : 0;
                    const isOver = spent > b.amount;
                    const remaining = b.amount - spent;
                    return (
                      <Draggable key={b.id} draggableId={b.id} index={idx}>
                        {(provided, snapshot) => (
                          <motion.tr 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className={`group ${snapshot.isDragging ? 'bg-gray-50' : ''}`}
                            style={{
                              ...provided.draggableProps.style,
                              backgroundColor: snapshot.isDragging ? 'rgb(249, 250, 251)' : undefined,
                            }}
                          >
                            <td className="px-2" {...provided.dragHandleProps}>
                              <GripVertical className="h-4 w-4 text-gray-300 cursor-grab active:cursor-grabbing" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{b.item_name || b.category_name}</span>
                                {b.category_name && (
                                  <span className="text-xs text-gray-400">{b.category_name}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm text-gray-700">{formatCurrency(b.amount)}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`text-sm font-semibold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>
                                {formatCurrency(spent)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`text-sm font-bold ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>
                                {formatCurrency(Math.abs(remaining))}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Progress value={pct} className={`h-1.5 flex-1 ${isOver ? '[&>div]:bg-red-500' : ''}`} />
                                <span className={`text-xs font-medium ${isOver ? 'text-red-600' : 'text-gray-500'} min-w-[35px] text-right`}>
                                  {pct.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditing(b); setShowForm(true); }}>
                                    <Pencil className="h-3 w-3 text-gray-400" />
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMut.mutate(b.id)}>
                                    <Trash2 className="h-3 w-3 text-gray-400" />
                                  </Button>
                                </motion.div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                  <tr className="bg-gray-50/50 font-semibold">
                    <td></td>
                    <td className="px-4 py-3 text-sm text-gray-900">TOTAL</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(totalBudget)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(totalSpent)}</td>
                    <td className={`px-4 py-3 text-right text-sm font-bold ${
                      totalBudget - totalSpent < 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {formatCurrency(Math.abs(totalBudget - totalSpent))}
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tbody>
              )}
            </Droppable>
          </table>
        </DragDropContext>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <PageHeader title="Budgets" subtitle="Track your spending by category">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goToPrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.span 
              key={selectedMonth.toISOString()}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-gray-900 min-w-[120px] text-center"
            >
              {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </motion.span>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm" className="gap-2" onClick={() => setEditing(null)}>
                  <Plus className="h-4 w-4" /> Add Budget
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Budget' : 'New Budget'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Item Name</Label>
                  <Input name="item_name" defaultValue={editing?.item_name || ''} required placeholder="e.g., Groceries, Spotify" />
                </div>
                <div>
                  <Label>Section</Label>
                  <select name="section" defaultValue={editing?.section || 'expenses'} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="income">Income</option>
                    <option value="expenses">Expenses</option>
                    <option value="bills">Bills</option>
                    <option value="subscriptions">Subscriptions</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>
                <div>
                  <Label>Category (for transaction matching)</Label>
                  <select name="category_id" defaultValue={editing?.category_id || ''} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="">Select category (optional)</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Monthly Budget Amount</Label>
                  <Input name="amount" type="number" step="0.01" defaultValue={editing?.amount || ''} required placeholder="0.00" />
                </div>
                <div>
                  <Label>Period</Label>
                  <select name="period" defaultValue={editing?.period || 'monthly'} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
        <div className="space-y-6">
          {sections.map((section, idx) => {
            if (section.budgets.length === 0) return null;
            const Icon = section.icon;
            
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`rounded-2xl border-2 ${section.borderColor} bg-white overflow-hidden`}
              >
                <div className={`${section.bgColor} px-6 py-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 3, delay: idx * 0.5 }}
                    >
                      <Icon className={`h-5 w-5 ${section.textColor}`} />
                    </motion.div>
                    <h3 className={`text-sm font-bold tracking-wider ${section.textColor}`}>
                      {section.title}
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500">
                    {section.budgets.length} {section.budgets.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                {renderBudgetTable(section.budgets, section.color)}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}