import React from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '../shared/CurrencyFormatter';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';

const typeConfig = {
  income: { icon: ArrowUpRight, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  expense: { icon: ArrowDownRight, color: 'bg-red-50 text-red-700 border-red-200' },
  transfer: { icon: ArrowRightLeft, color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export default function TransactionTable({ transactions, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-4">Date</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-4">Merchant</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-4">Category</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-4">Type</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-4">Person</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right py-4">Amount</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 w-20 py-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map(t => {
              const cfg = typeConfig[t.type] || typeConfig.expense;
              const Icon = cfg.icon;
              return (
                <TableRow key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="text-sm text-gray-600 whitespace-nowrap py-5">
                    {t.date ? format(new Date(t.date), 'MMM d, yyyy') : '—'}
                  </TableCell>
                  <TableCell className="py-5">
                    <p className="text-sm font-medium text-gray-800">{t.merchant || '—'}</p>
                    {t.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{t.description}</p>}
                  </TableCell>
                  <TableCell className="py-5">
                    <span className="text-sm text-gray-600">{t.category_name || '—'}</span>
                  </TableCell>
                  <TableCell className="py-5">
                    <Badge variant="outline" className={`${cfg.color} border text-xs gap-1`}>
                      <Icon className="h-3 w-3" />
                      {t.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 py-5">{t.person_name || '—'}</TableCell>
                  <TableCell className={`text-sm font-semibold text-right whitespace-nowrap py-5 ${t.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {t.type === 'income' ? '+' : ''}{formatCurrency(t.amount, t.currency)}
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(t)}>
                        <Pencil className="h-3.5 w-3.5 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(t)}>
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
  );
}