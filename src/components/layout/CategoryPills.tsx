import React from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../../stores/appStore';
import { CATEGORIES, CategoryId } from '../../lib/constants';
import { cn } from '../../lib/utils';

export const CategoryPills: React.FC = () => {
  const { activeCategory, setActiveCategory } = useAppStore();

  return (
    <div className="fixed top-20 left-0 right-0 z-30 h-16 bg-bg/80 backdrop-blur-3xl border-b border-white/[0.05] flex items-center overflow-x-auto no-scrollbar px-6 md:px-10 gap-6">
      {(Object.keys(CATEGORIES) as CategoryId[]).map((id) => {
        const cat = CATEGORIES[id];
        const isActive = activeCategory === id;

        return (
          <button
            key={id}
            onClick={() => setActiveCategory(id)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2.5 py-4 transition-all duration-500 text-[11px] font-bold uppercase tracking-widest relative group",
              isActive 
                ? "text-white" 
                : "text-white/30 hover:text-white/60"
            )}
            style={isActive ? { color: cat.color } : {}}
          >
            <span className={cn("text-sm transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110 grayscale opacity-50")}>
              {cat.emoji}
            </span>
            <span className="relative z-10">{cat.name}</span>
            {isActive && (
              <motion.div
                layoutId="active-nav-line"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: cat.color }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
