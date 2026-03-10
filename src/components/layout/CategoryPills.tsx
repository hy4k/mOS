import React from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../../stores/appStore';
import { CATEGORIES, CategoryId } from '../../lib/constants';
import { cn } from '../../lib/utils';

export const CategoryPills: React.FC = () => {
  const { activeCategory, setActiveCategory } = useAppStore();

  return (
    <div className="fixed top-[4.5rem] left-0 right-0 z-30 flex items-center overflow-x-auto no-scrollbar px-5 md:px-8 py-2 gap-2">
      {(Object.keys(CATEGORIES) as CategoryId[]).map((id) => {
        const cat = CATEGORIES[id];
        const isActive = activeCategory === id;

        return (
          <button
            key={id}
            onClick={() => setActiveCategory(id)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-400 border relative group",
              isActive 
                ? "text-white border-white/[0.12] shadow-[0_2px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]" 
                : "text-white/30 border-transparent hover:text-white/60 hover:bg-white/[0.03] hover:border-white/[0.06]"
            )}
            style={isActive ? { 
              backgroundColor: `${cat.color}12`,
              borderColor: `${cat.color}25`,
              color: cat.color,
              boxShadow: `0 2px 20px ${cat.color}15, inset 0 1px 0 rgba(255,255,255,0.03)`
            } : {}}
          >
            <span className={cn(
              "text-sm transition-all duration-300",
              isActive ? "scale-105" : "grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-80"
            )}>
              {cat.emoji}
            </span>
            <span className="relative z-10">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
};
