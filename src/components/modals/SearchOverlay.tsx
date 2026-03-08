import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useItems, Item } from '../../hooks/useItems';
import { CATEGORIES } from '../../lib/constants';
import { cn } from '../../lib/utils';

export const SearchOverlay: React.FC = () => {
  const { isSearchOpen, setSearchOpen, searchQuery, setSearchQuery, setSelectedItem } = useAppStore();
  const { items } = useItems(); // Fetch all items for search
  const [results, setResults] = useState<Item[]>([]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setResults([]);
      return;
    }

    const filtered = items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setResults(filtered);
  }, [searchQuery, items]);

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] glass-elevated p-4 md:p-8 flex flex-col"
        >
          <div className="max-w-3xl mx-auto w-full flex flex-col h-full">
            <div className="flex items-center gap-4 mb-12">
              <div className="flex-1 relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/10 group-focus-within:text-white/40 transition-colors" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your brain..."
                  className="w-full bg-white/[0.03] border border-white/[0.05] rounded-[2rem] pl-16 pr-8 py-6 text-2xl font-display font-light text-white placeholder:text-white/10 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all duration-500 shadow-2xl"
                />
              </div>
              <button 
                onClick={() => setSearchOpen(false)}
                className="p-6 rounded-[2rem] bg-white/[0.03] hover:bg-white/[0.08] text-white/20 hover:text-white transition-all duration-500 border border-white/[0.05]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
              {searchQuery.trim() === '' ? (
                <div className="flex flex-col items-center justify-center py-32 text-white/10">
                  <div className="w-20 h-20 rounded-[2.5rem] glass flex items-center justify-center mb-6 opacity-20">
                    <Search className="w-10 h-10" />
                  </div>
                  <p className="font-black uppercase tracking-widest-luxury text-[10px]">Initialize Search Protocol</p>
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-white/10">
                  <p className="font-black uppercase tracking-widest-luxury text-[10px]">No Neural Matches Found</p>
                </div>
              ) : (
                results.map((item, idx) => {
                  const cat = CATEGORIES[item.category as keyof typeof CATEGORIES];
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setSearchOpen(false);
                      }}
                      className="glass p-6 rounded-[2rem] flex items-center justify-between group cursor-pointer hover:bg-white/[0.06] transition-all duration-500 border border-white/[0.03] hover:border-white/[0.1]"
                    >
                      <div className="flex items-center gap-6 overflow-hidden">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center text-2xl border border-white/[0.05] group-hover:scale-110 transition-transform duration-500">
                          {cat.emoji}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-display font-medium text-lg text-white/90 truncate tracking-tight group-hover:text-white transition-colors">{item.title}</h4>
                          <p className="text-xs text-white/30 truncate font-light tracking-wide mt-0.5">{item.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span 
                          className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                          style={{ color: cat.color }}
                        >
                          {cat.name}
                        </span>
                        <ArrowRight className="w-5 h-5 text-white/10 group-hover:text-white/60 group-hover:translate-x-1 transition-all duration-500" />
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
