import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import {
  LayoutDashboard,
  ArrowRightLeft,
  PieChart,
  Receipt,
  TrendingUp,
  Landmark,
  Target,
  Calculator,
  BarChart3,
  Settings,
  Menu,
  X,
  Wallet
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Annual', icon: BarChart3, page: 'AnnualDashboard' },
  { name: 'Transactions', icon: ArrowRightLeft, page: 'Transactions' },
  { name: 'Budgets', icon: PieChart, page: 'Budgets' },
  { name: 'Net Worth', icon: TrendingUp, page: 'NetWorth' },
  { name: 'Investments', icon: BarChart3, page: 'Investments' },
  { name: 'Pensions', icon: Landmark, page: 'Pensions' },
  { name: 'Goals', icon: Target, page: 'Goals' },
  { name: 'Calculators', icon: Calculator, page: 'Calculators' },
  { name: 'Settings', icon: Settings, page: 'Settings' },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#FAFAFA] overflow-hidden">
      <style>{`
        :root {
          --brand: #111827;
          --brand-light: #F3F4F6;
          --accent: #2563EB;
          --accent-light: #EFF6FF;
        }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 
        transform transition-transform duration-300 ease-out
        lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-gray-900">FinOS</span>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Personal Finance</p>
            </div>
            <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon className={`h-[18px] w-[18px] ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-50 px-4 py-4">
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium text-gray-500">Base Currency</p>
              <p className="text-sm font-bold text-gray-900">USD ($)</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="flex items-center gap-4 border-b border-gray-100 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">FinOS</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}