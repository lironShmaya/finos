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
  { name: 'Transactions', icon: ArrowRightLeft, page: 'Transactions' },
  { name: 'Budgets', icon: PieChart, page: 'Budgets' },
  { name: 'Bills', icon: Receipt, page: 'Bills' },
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
    <div className="flex h-screen bg-[#0B132B] overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        
        :root {
          --deep-navy: #0B132B;
          --teal-blue: #1C7293;
          --light-cyan: #A6E1FA;
          --soft-white: #F4F7FB;
          --purple: #6C63FF;
          --orange: #FF9F43;
          --emerald: #2ED573;
          --soft-red: #FF6B6B;
        }
        
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #0B132B;
          color: #F4F7FB;
        }
        
        .font-mono { font-family: 'JetBrains Mono', monospace !important; }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(28, 114, 147, 0.4); border-radius: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        
        * { transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease; }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0D1B2A] border-r border-[#1C7293]/20 
        transform transition-all duration-300 ease-out
        lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-[#1C7293]/20">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1C7293] to-[#6C63FF] shadow-lg shadow-[#1C7293]/20">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#F4F7FB]">FinOS</span>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[#A6E1FA]/60">Command Center</p>
            </div>
            <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5 text-[#A6E1FA]/60 hover:text-[#A6E1FA]" />
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
                    group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-[#1C7293] to-[#1C7293]/80 text-[#F4F7FB] shadow-lg shadow-[#1C7293]/30'
                      : 'text-[#A6E1FA]/70 hover:bg-[#1C7293]/10 hover:text-[#A6E1FA]'
                    }
                  `}
                  style={isActive ? {} : { transform: 'translateX(0)' }}
                  onMouseEnter={(e) => !isActive && (e.currentTarget.style.transform = 'translateX(2px)')}
                  onMouseLeave={(e) => !isActive && (e.currentTarget.style.transform = 'translateX(0)')}
                >
                  <item.icon className={`h-[18px] w-[18px] transition-transform duration-200 ${isActive ? 'text-[#A6E1FA]' : 'text-[#A6E1FA]/50 group-hover:text-[#A6E1FA]'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-[#1C7293]/20 px-4 py-4">
            <div className="rounded-xl bg-[#1C7293]/10 border border-[#1C7293]/20 px-4 py-3 hover:bg-[#1C7293]/20 transition-colors duration-200">
              <p className="text-xs font-medium text-[#A6E1FA]/60">Base Currency</p>
              <p className="text-sm font-bold text-[#A6E1FA] font-mono">USD ($)</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B132B]">
        {/* Top bar (mobile) */}
        <header className="flex items-center gap-4 border-b border-[#1C7293]/20 bg-[#0D1B2A] px-4 py-3 lg:hidden backdrop-blur-xl">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-[#A6E1FA]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#1C7293] to-[#6C63FF]">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-[#F4F7FB]">FinOS</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}