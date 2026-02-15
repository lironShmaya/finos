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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, BarChart3, Pencil, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#111827', '#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#8B5CF6'];

export default function Investments() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const queryClient = useQueryClient();

  const { data: holdings = [] } = useQuery({
    queryKey: ['holdings'],
    queryFn: () => base44.entities.Holding.list(),
  });

  // Real-time auto-updates
  useEffect(() => {
    const unsubscribe = base44.entities.Holding.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const handleUpdateAllPrices = async () => {
    setUpdatingPrices(true);
    try {
      const { data } = await base44.functions.invoke('updateAllHoldingPrices', {});
      toast.success(`Updated ${data.updated} of ${data.total} holdings`);
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
    } catch (error) {
      toast.error('Failed to update prices: ' + error.message);
    } finally {
      setUpdatingPrices(false);
    }
  };

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.Holding.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['holdings'] }); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Holding.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['holdings'] }); setEditing(null); setShowForm(false); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Holding.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holdings'] }),
  });

  const totalValue = holdings.reduce((s, h) => s + (h.market_value || h.quantity * h.current_price || 0), 0);
  const totalCost = holdings.reduce((s, h) => s + (h.quantity * h.avg_cost || 0), 0);
  const totalPL = totalValue - totalCost;
  const totalPLPct = totalCost > 0 ? ((totalPL / totalCost) * 100).toFixed(2) : 0;

  const allocationData = {};
  holdings.forEach(h => {
    const cls = h.asset_class || 'other';
    allocationData[cls] = (allocationData[cls] || 0) + (h.market_value || h.quantity * h.current_price || 0);
  });
  const pieData = Object.entries(allocationData).map(([name, value]) => ({ name, value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const qty = parseFloat(fd.get('quantity'));
    const avgCost = parseFloat(fd.get('avg_cost'));
    const price = parseFloat(fd.get('current_price'));
    const data = {
      symbol: fd.get('symbol'),
      name: fd.get('name'),
      asset_class: fd.get('asset_class'),
      quantity: qty,
      avg_cost: avgCost,
      current_price: price,
      currency: fd.get('currency') || 'USD',
      market_value: qty * price,
      unrealized_pl: (price - avgCost) * qty,
      unrealized_pl_pct: avgCost > 0 ? (((price - avgCost) / avgCost) * 100) : 0,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Investments" subtitle={`${holdings.length} holdings`}>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-2" 
            onClick={handleUpdateAllPrices}
            disabled={updatingPrices || holdings.length === 0}
          >
            <RefreshCw className={`h-4 w-4 ${updatingPrices ? 'animate-spin' : ''}`} />
            Update Prices
          </Button>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" onClick={() => setEditing(null)}>
                <Plus className="h-4 w-4" /> Add Holding
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Holding' : 'New Holding'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Symbol</Label><Input name="symbol" defaultValue={editing?.symbol || ''} required placeholder="AAPL" /></div>
                <div><Label>Name</Label><Input name="name" defaultValue={editing?.name || ''} placeholder="Apple Inc." /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Asset Class</Label>
                  <Select name="asset_class" defaultValue={editing?.asset_class || 'stocks'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stocks">Stocks</SelectItem>
                      <SelectItem value="bonds">Bonds</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                      <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="commodities">Commodities</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
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
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Quantity</Label><Input name="quantity" type="number" step="0.0001" defaultValue={editing?.quantity || ''} required /></div>
                <div><Label>Avg Cost</Label><Input name="avg_cost" type="number" step="0.01" defaultValue={editing?.avg_cost || ''} required /></div>
                <div><Label>Current Price</Label><Input name="current_price" type="number" step="0.01" defaultValue={editing?.current_price || ''} required /></div>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Value" value={formatCurrency(totalValue)} icon={BarChart3} />
        <StatCard title="Total P&L" value={formatCurrency(totalPL)} icon={totalPL >= 0 ? TrendingUp : TrendingDown} trend={`${totalPLPct}%`} trendUp={totalPL >= 0} />
        <StatCard title="Total Cost" value={formatCurrency(totalCost)} icon={BarChart3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {pieData.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Allocation</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-600">{d.name}</span>
                  <span className="ml-auto text-gray-400">{totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={pieData.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}>
          {holdings.length === 0 ? (
            <EmptyState icon={BarChart3} title="No holdings" description="Add your investment holdings to track performance." actionLabel="Add Holding" onAction={() => setShowForm(true)} />
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="text-xs uppercase tracking-wider text-gray-400">Symbol</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-gray-400">Class</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-gray-400 text-right">Qty</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-gray-400 text-right">Avg Cost</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-gray-400 text-right">Price</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-gray-400 text-right">Value</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-gray-400 text-right">P&L</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holdings.map(h => {
                      const mv = h.market_value || h.quantity * h.current_price;
                      const pl = (h.current_price - h.avg_cost) * h.quantity;
                      const plPct = h.avg_cost > 0 ? ((h.current_price - h.avg_cost) / h.avg_cost * 100).toFixed(2) : 0;
                      return (
                        <TableRow key={h.id} className="hover:bg-gray-50/50">
                          <TableCell>
                            <p className="text-sm font-semibold text-gray-900">{h.symbol}</p>
                            <p className="text-xs text-gray-400 truncate max-w-[120px]">{h.name}</p>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{h.asset_class}</Badge></TableCell>
                          <TableCell className="text-right text-sm">{h.quantity}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(h.avg_cost, h.currency)}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(h.current_price, h.currency)}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{formatCurrency(mv, h.currency)}</TableCell>
                          <TableCell className={`text-right text-sm font-semibold ${pl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {pl >= 0 ? '+' : ''}{formatCurrency(pl, h.currency)}
                            <span className="block text-xs">{plPct}%</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(h); setShowForm(true); }}>
                                <Pencil className="h-3.5 w-3.5 text-gray-400" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(h.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}