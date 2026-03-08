import React from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { CATEGORIES } from '../../lib/constants';

export const FAB: React.FC = () => {
  const { activeCategory, setAddItemOpen } = useAppStore();
  const category = CATEGORIES[activeCategory];

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95, y: 0 }}
      onClick={() => setAddItemOpen(true)}
      className="fixed bottom-10 right-10 w-16 h-16 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center z-50 overflow-hidden border border-white/[0.1] group"
      style={{ 
        background: `linear-gradient(135deg, ${category.color}, ${category.color}cc)`,
      }}
    >
      <Plus className="w-8 h-8 text-white group-hover:rotate-90 transition-transform duration-500" />
      
      {/* Dynamic glow effect */}
      <motion.div
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-white rounded-full blur-2xl pointer-events-none"
      />

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </motion.button>
  );
};
