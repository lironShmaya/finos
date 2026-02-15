import React from 'react';
import { motion } from 'framer-motion';

export default function PageHeader({ title, subtitle, children }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
    >
      <div>
        <motion.h1 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent"
        >{title}</motion.h1>
        {subtitle && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mt-1 text-sm text-gray-500"
          >{subtitle}</motion.p>
        )}
      </div>
      {children && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex items-center gap-3"
        >{children}</motion.div>
      )}
    </motion.div>
  );
}