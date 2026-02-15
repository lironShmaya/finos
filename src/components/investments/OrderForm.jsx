import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function OrderForm({ onSubmit, onCancel }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      date: fd.get('date'),
      symbol: fd.get('symbol').toUpperCase(),
      company_name: fd.get('company_name'),
      order_type: fd.get('order_type'),
      price: parseFloat(fd.get('price')),
      quantity: parseFloat(fd.get('quantity')),
      currency: fd.get('currency') || 'USD',
      asset_class: fd.get('asset_class') || 'stocks',
    };
    onSubmit(data);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Order</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Date</Label>
            <Input name="date" type="date" defaultValue={today} required />
          </div>
          <div>
            <Label>Order Type</Label>
            <Select name="order_type" defaultValue="buy">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Symbol</Label>
            <Input name="symbol" required placeholder="AAPL" className="uppercase" />
          </div>
          <div>
            <Label>Company Name</Label>
            <Input name="company_name" placeholder="Apple Inc." />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Price</Label>
            <Input name="price" type="number" step="0.01" required placeholder="0.00" />
          </div>
          <div>
            <Label>Quantity</Label>
            <Input name="quantity" type="number" step="0.0001" required placeholder="0" />
          </div>
          <div>
            <Label>Currency</Label>
            <Select name="currency" defaultValue="USD">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="ILS">ILS</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Asset Class</Label>
          <Select name="asset_class" defaultValue="stocks">
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
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Add Order</Button>
        </div>
      </form>
    </div>
  );
}