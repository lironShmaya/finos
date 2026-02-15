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
      className={`relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 ${className}`}
      style={{
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
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <motion.p 
            className="text-xs font-medium uppercase tracking-widest text-gray-400"
            animate={{ x: isHovered ? 2 : 0 }}
            transition={{ duration: 0.2 }}
          >{title}</motion.p>
          <motion.p 
            className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent"
            animate={{ scale: isHovered ? 1.03 : 1 }}
            transition={{ duration: 0.2 }}
          >{value}</motion.p>
          {subtitle && (
            <motion.p 
              className="text-sm text-gray-500"
              initial={{ opacity: 0.7 }}
              animate={{ opacity: isHovered ? 1 : 0.7 }}
            >{subtitle}</motion.p>
          )}
          {trend && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}
            >
              {trendUp ? '↑' : '↓'} {trend}
            </motion.div>
          )}
        </div>
        {Icon && (
          <motion.div 
            className="rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 p-3"
            animate={{ 
              scale: isHovered ? 1.1 : 1,
              rotate: isHovered ? 5 : 0 
            }}
            transition={{ duration: 0.2 }}
          >
            <Icon className="h-5 w-5 text-blue-600" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}