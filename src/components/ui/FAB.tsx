import React from 'react';
import { motion } from 'motion/react';
import { Plus, Sparkles } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { CATEGORIES } from '../../lib/constants';

export const FAB: React.FC = () => {
  const { activeCategory, setAddItemOpen, setMagicModeOpen } = useAppStore();
  const category = CATEGORIES[activeCategory];

  return (
    <div className="fixed bottom-10 right-10 flex flex-col items-center gap-4 z-50">
      {/* Magic Add Button */}
      <motion.button
        whileHover={{ scale: 1.05, y: -4 }}
        whileTap={{ scale: 0.95, y: 0 }}
        onClick={() => {
          setMagicModeOpen(true);
          setAddItemOpen(true);
        }}
        className="w-14 h-14 rounded-full shadow-[0_10px_30px_rgba(99,102,241,0.4)] flex items-center justify-center overflow-hidden border border-indigo-500/30 group bg-indigo-500/20 backdrop-blur-xl"
      >
        <Sparkles className="w-6 h-6 text-indigo-300 group-hover:scale-110 transition-transform duration-500" />
        
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </motion.button>

      {/* Standard Add Button */}
      <motion.button
        whileHover={{ scale: 1.05, y: -4 }}
        whileTap={{ scale: 0.95, y: 0 }}
        onClick={() => {
          setMagicModeOpen(false);
          setAddItemOpen(true);
        }}
        className="w-16 h-16 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden border border-white/[0.1] group"
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
    </div>
  );
};

