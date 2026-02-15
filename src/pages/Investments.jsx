import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import StatCard from '../components/shared/StatCard';
import EmptyState from '../components/shared/EmptyState';
import OrderForm from '../components/investments/OrderForm';
import { formatCurrency } from '../components/shared/CurrencyFormatter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, BarChart3, Trash2, TrendingUp, TrendingDown, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';

const COLORS = ['#111827', '#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#8B5CF6'];

const EXCHANGE_RATES = {
  USD: { USD: 1, ILS: 3.59, EUR: 0.92, GBP: 0.79 },
  ILS: { USD: 0.28, ILS: 1, EUR: 0.26, GBP: 0.22 },
  EUR: { USD: 1.09, ILS: 3.91, EUR: 1, GBP: 0.86 },
  GBP: { USD: 1.27, ILS: 4.55, EUR: 1.16, GBP: 1 },
};

export default function Investments() {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc');
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [timeRange, setTimeRange] = useState('all');
  const queryClient = useQueryClient();

  const { data: holdings = [] } = useQuery({
    queryKey: ['holdings'],
    queryFn: () => base44.entities.Holding.list(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-date'),
  });

  // Filter orders by time range
  const getDateCutoff = () => {
    const now = new Date();
    switch (timeRange) {
      case '1w': return new Date(now.setDate(now.getDate() - 7));
      case '1m': return new Date(now.setMonth(now.getMonth() - 1));
      case '3m': return new Date(now.setMonth(now.getMonth() - 3));
      case '6m': return new Date(now.setMonth(now.getMonth() - 6));
      case 'ytd': return new Date(now.getFullYear(), 0, 1);
      case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
      case '2y': return new Date(now.setFullYear(now.getFullYear() - 2));
      case '3y': return new Date(now.setFullYear(now.getFullYear() - 3));
      case '5y': return new Date(now.setFullYear(now.getFullYear() - 5));
      default: return new Date(0);
    }
  };

  const filteredOrders = timeRange === 'all' 
    ? orders 
    : orders.filter(o => new Date(o.date) >= getDateCutoff());

  // Real-time auto-updates
  useEffect(() => {
    const unsubscribeHolding = base44.entities.Holding.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
    });
    const unsubscribeOrder = base44.entities.Order.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });
    return () => {
      unsubscribeHolding();
      unsubscribeOrder();
    };
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

  const createOrderMut = useMutation({
    mutationFn: (d) => base44.entities.Order.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowOrderForm(false);
    },
  });

  const deleteHoldingMut = useMutation({
    mutationFn: (id) => base44.entities.Holding.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holdings'] }),
  });

  // Convert to display currency
  const convertCurrency = (amount, fromCurrency) => {
    if (!fromCurrency || fromCurrency === displayCurrency) return amount;
    const rate = EXCHANGE_RATES[fromCurrency]?.[displayCurrency] || 1;
    return amount * rate;
  };

  // Calculate totals in display currency
  const totalValue = holdings.reduce((s, h) => s + convertCurrency(h.market_value || h.quantity * h.current_price || 0, h.currency), 0);
  const totalCost = holdings.reduce((s, h) => s + convertCurrency(h.quantity * h.avg_cost || 0, h.currency), 0);
  const totalPL = totalValue - totalCost;
  const totalPLPct = totalCost > 0 ? ((totalPL / totalCost) * 100) : 0;

  // Cash holdings
  const cashHoldings = holdings.filter(h => h.asset_class === 'cash');
  const totalCash = cashHoldings.reduce((s, h) => s + convertCurrency(h.market_value || h.quantity * h.current_price || 0, h.currency), 0);
  const cashPct = totalValue > 0 ? ((totalCash / totalValue) * 100) : 0;

  // Best and worst performers
  const performersData = holdings
    .filter(h => h.avg_cost > 0)
    .map(h => ({
      symbol: h.symbol,
      plPct: ((h.current_price - h.avg_cost) / h.avg_cost) * 100
    }))
    .sort((a, b) => b.plPct - a.plPct);

  const bestPerformer = performersData[0];
  const worstPerformer = performersData[performersData.length - 1];

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedHoldings = [...holdings].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aVal, bVal;
    
    if (sortColumn === 'pl') {
      aVal = (a.current_price - a.avg_cost) * a.quantity;
      bVal = (b.current_price - b.avg_cost) * b.quantity;
    } else if (sortColumn === 'value') {
      aVal = a.market_value || a.quantity * a.current_price;
      bVal = b.market_value || b.quantity * b.current_price;
    } else if (sortColumn === 'avg_cost') {
      aVal = a.avg_cost;
      bVal = b.avg_cost;
    }
    
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const allocationData = {};
  holdings.forEach(h => {
    const cls = h.asset_class || 'other';
    allocationData[cls] = (allocationData[cls] || 0) + (h.market_value || h.quantity * h.current_price || 0);
  });
  const pieData = Object.entries(allocationData).map(([name, value]) => ({ name, value }));

  const handleOrderSubmit = async (orderData) => {
    try {
      // Create the order
      await createOrderMut.mutateAsync(orderData);

      // Find existing holding
      const existingHolding = holdings.find(h => h.symbol === orderData.symbol);
      let holdingId = existingHolding?.id;

      if (orderData.order_type === 'buy') {
        const useCurrentPrice = orderData.current_price || orderData.price;
        
        if (existingHolding) {
          // Update existing holding - calculate weighted average cost
          const totalCost = (existingHolding.quantity * existingHolding.avg_cost) + (orderData.quantity * orderData.price);
          const totalQty = existingHolding.quantity + orderData.quantity;
          const newAvgCost = totalCost / totalQty;

          await base44.entities.Holding.update(existingHolding.id, {
            quantity: totalQty,
            avg_cost: newAvgCost,
            current_price: useCurrentPrice,
            market_value: totalQty * useCurrentPrice,
            unrealized_pl: (useCurrentPrice - newAvgCost) * totalQty,
            unrealized_pl_pct: newAvgCost > 0 ? (((useCurrentPrice - newAvgCost) / newAvgCost) * 100) : 0,
          });
        } else {
          // Create new holding
          const newHolding = await base44.entities.Holding.create({
            symbol: orderData.symbol,
            name: orderData.company_name || orderData.symbol,
            asset_class: orderData.asset_class,
            quantity: orderData.quantity,
            avg_cost: orderData.price,
            current_price: useCurrentPrice,
            currency: orderData.currency,
            market_value: orderData.quantity * useCurrentPrice,
            unrealized_pl: (useCurrentPrice - orderData.price) * orderData.quantity,
            unrealized_pl_pct: orderData.price > 0 ? (((useCurrentPrice - orderData.price) / orderData.price) * 100) : 0,
          });
          holdingId = newHolding.id;
        }
        
        // Update current price from market only if not manually provided
        if (holdingId && orderData.asset_class !== 'cash' && !orderData.current_price) {
          try {
            await base44.functions.invoke('updateStockPrice', { holding_id: holdingId });
          } catch (e) {
            console.log('Could not fetch current price:', e.message);
          }
        }
        
        toast.success(`Bought ${orderData.quantity} shares of ${orderData.symbol}`);
      } else if (orderData.order_type === 'sell') {
        if (!existingHolding) {
          toast.error(`Cannot sell ${orderData.symbol} - not in portfolio`);
          return;
        }

        const newQty = existingHolding.quantity - orderData.quantity;
        const useCurrentPrice = orderData.current_price || orderData.price;

        if (newQty <= 0) {
          // Delete holding if quantity reaches 0 or below
          await base44.entities.Holding.delete(existingHolding.id);
          toast.success(`Sold all shares of ${orderData.symbol}`);
        } else {
          // Update holding with reduced quantity
          await base44.entities.Holding.update(existingHolding.id, {
            quantity: newQty,
            current_price: useCurrentPrice,
            market_value: newQty * useCurrentPrice,
            unrealized_pl: (useCurrentPrice - existingHolding.avg_cost) * newQty,
            unrealized_pl_pct: existingHolding.avg_cost > 0 ? (((useCurrentPrice - existingHolding.avg_cost) / existingHolding.avg_cost) * 100) : 0,
          });
          toast.success(`Sold ${orderData.quantity} shares of ${orderData.symbol}`);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['holdings'] });
    } catch (error) {
      toast.error('Failed to process order: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Investments" subtitle={`${holdings.length} holdings`}>
        <div className="flex gap-2 flex-wrap">
          <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
            <SelectTrigger className="w-24 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="ILS">ILS</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
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
          <Button size="sm" className="gap-2" onClick={() => setShowOrderForm(!showOrderForm)}>
            <Plus className="h-4 w-4" /> Add Order
          </Button>
        </div>
      </PageHeader>

      <Tabs value={timeRange} onValueChange={setTimeRange} className="w-full">
        <TabsList className="grid grid-cols-5 lg:grid-cols-10 w-full">
          <TabsTrigger value="1w" className="text-xs">1W</TabsTrigger>
          <TabsTrigger value="1m" className="text-xs">1M</TabsTrigger>
          <TabsTrigger value="3m" className="text-xs">3M</TabsTrigger>
          <TabsTrigger value="6m" className="text-xs">6M</TabsTrigger>
          <TabsTrigger value="ytd" className="text-xs">YTD</TabsTrigger>
          <TabsTrigger value="1y" className="text-xs">1Y</TabsTrigger>
          <TabsTrigger value="2y" className="text-xs">2Y</TabsTrigger>
          <TabsTrigger value="3y" className="text-xs">3Y</TabsTrigger>
          <TabsTrigger value="5y" className="text-xs">5Y</TabsTrigger>
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <AnimatePresence>
        {showOrderForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <OrderForm onSubmit={handleOrderSubmit} onCancel={() => setShowOrderForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        key={timeRange}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <StatCard 
          title="Total Portfolio Value" 
          value={formatCurrency(totalValue, displayCurrency)} 
          icon={BarChart3} 
        />
        <StatCard 
          title="Total Invested" 
          value={formatCurrency(totalCost, displayCurrency)} 
          icon={BarChart3} 
        />
        <StatCard 
          title="Unrealized P/L" 
          value={formatCurrency(totalPL, displayCurrency)} 
          subtitle={
            <span className={
              totalPLPct > 0 ? 'text-green-600' : 
              totalPLPct < 0 ? 'text-red-600' : 
              'text-gray-600'
            }>
              {totalPLPct.toFixed(2)}%
            </span>
          }
          icon={totalPL >= 0 ? TrendingUp : TrendingDown} 
        />
        <StatCard 
          title="Best Performer" 
          value={bestPerformer?.symbol || 'N/A'} 
          subtitle={
            bestPerformer ? (
              <span className={
                bestPerformer.plPct > 0 ? 'text-green-600' : 
                bestPerformer.plPct < 0 ? 'text-red-600' : 
                'text-gray-600'
              }>
                {bestPerformer.plPct.toFixed(2)}%
              </span>
            ) : ''
          }
          icon={TrendingUp} 
        />
        <StatCard 
          title="Worst Performer" 
          value={worstPerformer?.symbol || 'N/A'} 
          subtitle={
            worstPerformer ? (
              <span className={
                worstPerformer.plPct > 0 ? 'text-green-600' : 
                worstPerformer.plPct < 0 ? 'text-red-600' : 
                'text-gray-600'
              }>
                {worstPerformer.plPct.toFixed(2)}%
              </span>
            ) : ''
          }
          icon={TrendingDown} 
        />
      </motion.div>

      <div className="flex gap-3 max-w-3xl">
        <StatCard 
          title="Cash" 
          value={formatCurrency(totalCash, displayCurrency)} 
          icon={BarChart3} 
          className="flex-1"
        />
        <StatCard 
          title="% Cash" 
          value={`${cashPct.toFixed(2)}%`} 
          icon={BarChart3} 
          className="flex-1"
        />
        <StatCard 
          title="USD/ILS" 
          value="3.590" 
          icon={BarChart3} 
          className="flex-1"
        />
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
                      <TableHead 
                        className="text-xs uppercase tracking-wider text-gray-400 text-right cursor-pointer hover:text-gray-600 transition-colors"
                        onClick={() => handleSort('avg_cost')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Avg Cost
                          {sortColumn === 'avg_cost' ? (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                        </div>
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-gray-400 text-right">Price</TableHead>
                      <TableHead 
                        className="text-xs uppercase tracking-wider text-gray-400 text-right cursor-pointer hover:text-gray-600 transition-colors"
                        onClick={() => handleSort('value')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Value
                          {sortColumn === 'value' ? (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-xs uppercase tracking-wider text-gray-400 text-right cursor-pointer hover:text-gray-600 transition-colors"
                        onClick={() => handleSort('pl')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          P&L
                          {sortColumn === 'pl' ? (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                        </div>
                      </TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedHoldings.map(h => {
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
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteHoldingMut.mutate(h.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                            </Button>
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