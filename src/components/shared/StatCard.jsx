import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className = '' }) {
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 ${className}`}
      style={{
        height: '120px',
        boxShadow: isHovered 
          ? '0 20px 40px -12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(37, 99, 235, 0.1)' 
          : '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
      }}
    >
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-blue-50/30 to-purple-50/50 opacity-0"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative flex flex-col justify-between h-full">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 mb-1.5 truncate">
              {title}
            </p>
            <p className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
              {value}
            </p>
          </div>
          {Icon && (
            <motion.div 
              className="rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 p-2 flex-shrink-0 ml-3"
              animate={{ 
                scale: isHovered ? 1.1 : 1,
                rotate: isHovered ? 5 : 0 
              }}
              transition={{ duration: 0.2 }}
            >
              <Icon className="h-4 w-4 text-blue-600" />
            </motion.div>
          )}
        </div>
        <div>
          {subtitle && (
            <p className="text-xs font-medium text-gray-600 truncate">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}