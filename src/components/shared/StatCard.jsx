import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className = '' }) {
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl border border-[#1C7293]/20 bg-gradient-to-br from-[#0D1B2A] to-[#0D1B2A]/80 p-6 backdrop-blur-xl ${className}`}
      style={{
        boxShadow: isHovered 
          ? '0 12px 24px -8px rgba(28, 114, 147, 0.3), 0 0 0 1px rgba(28, 114, 147, 0.2)' 
          : '0 4px 12px -4px rgba(0, 0, 0, 0.3)'
      }}
    >
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-[#1C7293]/10 to-transparent opacity-0 pointer-events-none"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-[#A6E1FA]/60">{title}</p>
          <motion.p 
            className="text-2xl font-bold tracking-tight text-[#F4F7FB] font-mono"
            animate={{ scale: isHovered ? 1.02 : 1 }}
            transition={{ duration: 0.15 }}
          >{value}</motion.p>
          {subtitle && <p className="text-sm text-[#A6E1FA]/70">{subtitle}</p>}
          {trend && (
            <motion.div 
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trendUp ? 'bg-[#2ED573]/20 text-[#2ED573] border border-[#2ED573]/30' : 'bg-[#FF6B6B]/20 text-[#FF6B6B] border border-[#FF6B6B]/30'}`}
            >
              {trendUp ? '↑' : '↓'} {trend}
            </motion.div>
          )}
        </div>
        {Icon && (
          <motion.div 
            className="rounded-xl bg-gradient-to-br from-[#1C7293]/20 to-[#6C63FF]/10 p-3 border border-[#1C7293]/30"
            animate={{ scale: isHovered ? 1.1 : 1, rotate: isHovered ? 5 : 0 }}
            transition={{ duration: 0.18 }}
          >
            <Icon className="h-5 w-5 text-[#A6E1FA]" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}