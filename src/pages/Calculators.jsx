import React, { useState } from 'react';
import PageHeader from '../components/shared/PageHeader';
import { formatCurrency } from '../components/shared/CurrencyFormatter';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function CompoundInterest() {
  const [initial, setInitial] = useState(10000);
  const [monthly, setMonthly] = useState(500);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(7);

  const monthlyRate = rate / 100 / 12;
  const totalMonths = years * 12;
  
  const data = [];
  let balance = initial;
  for (let y = 0; y <= years; y++) {
    data.push({ year: y, value: Math.round(balance), contributions: initial + monthly * 12 * y });
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + monthly;
    }
  }

  const finalValue = data[data.length - 1]?.value || 0;
  const totalContributions = initial + monthly * totalMonths;
  const totalReturns = finalValue - totalContributions;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div><Label>Initial Amount</Label><Input type="number" value={initial} onChange={(e) => setInitial(Number(e.target.value))} /></div>
        <div><Label>Monthly Contribution</Label><Input type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} /></div>
        <div><Label>Years</Label><Input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} /></div>
        <div><Label>Annual Return %</Label><Input type="number" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} /></div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Future Value</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(finalValue, 'USD', true)}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Contributions</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalContributions, 'USD', true)}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Returns</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalReturns, 'USD', true)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ciGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9CA3AF" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#9CA3AF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Area type="monotone" dataKey="contributions" stroke="#9CA3AF" strokeWidth={1.5} fill="url(#ciGrad2)" name="Contributions" />
            <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} fill="url(#ciGrad)" name="Total Value" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LoanAmortization() {
  const [principal, setPrincipal] = useState(300000);
  const [annualRate, setAnnualRate] = useState(5);
  const [loanYears, setLoanYears] = useState(30);

  const r = annualRate / 100 / 12;
  const n = loanYears * 12;
  const monthlyPayment = r > 0 ? principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : principal / n;
  const totalPaid = monthlyPayment * n;
  const totalInterest = totalPaid - principal;

  const data = [];
  let balance = principal;
  for (let y = 0; y <= loanYears; y++) {
    data.push({ year: y, balance: Math.round(Math.max(0, balance)) });
    for (let m = 0; m < 12; m++) {
      const interest = balance * r;
      const princ = monthlyPayment - interest;
      balance -= princ;
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div><Label>Loan Amount</Label><Input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} /></div>
        <div><Label>Annual Rate %</Label><Input type="number" step="0.1" value={annualRate} onChange={(e) => setAnnualRate(Number(e.target.value))} /></div>
        <div><Label>Years</Label><Input type="number" value={loanYears} onChange={(e) => setLoanYears(Number(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Monthly Payment</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyPayment)}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Interest</p>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(totalInterest, 'USD', true)}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPaid, 'USD', true)}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="loanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DC2626" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Area type="monotone" dataKey="balance" stroke="#DC2626" strokeWidth={2} fill="url(#loanGrad)" name="Remaining Balance" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Calculators() {
  return (
    <div className="space-y-6">
      <PageHeader title="Calculators" subtitle="Financial planning tools" />
      <Tabs defaultValue="compound" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compound">Compound Interest</TabsTrigger>
          <TabsTrigger value="loan">Loan Amortization</TabsTrigger>
        </TabsList>
        <TabsContent value="compound"><CompoundInterest /></TabsContent>
        <TabsContent value="loan"><LoanAmortization /></TabsContent>
      </Tabs>
    </div>
  );
}