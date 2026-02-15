import React from 'react';

const currencySymbols = {
  USD: '$',
  ILS: '₪',
  EUR: '€',
  GBP: '£'
};

export function formatCurrency(amount, currency = 'USD', compact = false) {
  if (amount == null || isNaN(amount)) return '—';
  const symbol = currencySymbols[currency] || currency;
  const absAmount = Math.abs(amount);
  
  if (compact && absAmount >= 1000000) {
    return `${amount < 0 ? '-' : ''}${symbol}${(absAmount / 1000000).toFixed(1)}M`;
  }
  if (compact && absAmount >= 1000) {
    return `${amount < 0 ? '-' : ''}${symbol}${(absAmount / 1000).toFixed(1)}K`;
  }
  
  return `${amount < 0 ? '-' : ''}${symbol}${absAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CurrencyDisplay({ amount, currency = 'USD', compact = false, className = '' }) {
  const isNegative = amount < 0;
  return (
    <span className={`${isNegative ? 'text-red-500' : ''} ${className}`}>
      {formatCurrency(amount, currency, compact)}
    </span>
  );
}

export default CurrencyDisplay;