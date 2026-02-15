import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="mb-4 rounded-2xl bg-[#1C7293]/10 border border-[#1C7293]/20 p-4">
          <Icon className="h-8 w-8 text-[#A6E1FA]/40" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#F4F7FB]">{title}</h3>
      <p className="mt-1 text-sm text-[#A6E1FA]/60 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6 gap-2 bg-gradient-to-r from-[#1C7293] to-[#6C63FF] hover:from-[#1C7293]/90 hover:to-[#6C63FF]/90 text-white border-0 shadow-lg shadow-[#1C7293]/30" size="sm">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}