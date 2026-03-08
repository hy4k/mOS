import React, { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/layout/Header';
import { CategoryPills } from './components/layout/CategoryPills';
import { FAB } from './components/ui/FAB';
import { ItemCard } from './components/cards/ItemCard';
import { AddItemSheet } from './components/modals/AddItemSheet';
import { SearchOverlay } from './components/modals/SearchOverlay';
import { ItemDetailsModal } from './components/modals/ItemDetailsModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { SplashScreen } from './components/ui/SplashScreen';
import { AuthScreen } from './components/auth/AuthScreen';
import { useItems } from './hooks/useItems';
import { useAppStore } from './stores/appStore';
import { useAuthStore } from './stores/authStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { CATEGORIES } from './lib/constants';
import { cn } from './lib/utils';
import { ArrowDownAZ, ArrowUpAZ, CalendarDays, Clock, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const { activeCategory, viewMode, sortBy, sortDirection, setSortBy, setSortDirection } = useAppStore();
  const { user, session, setUser, setSession } = useAuthStore();
  const [isAuthChecking, setIsAuthChecking] = React.useState(true);
  const { items, loading, error, addItem, updateItem, deleteItem } = useItems(activeCategory);
  const [showSplash, setShowSplash] = React.useState(true);
  const category = CATEGORIES[activeCategory];

  useKeyboardShortcuts();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error fetching session:", error.message);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthChecking(false);
    }).catch((err) => {
      console.error("Failed to fetch session:", err);
      setIsAuthChecking(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      // Pinned items always come first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, sortBy, sortDirection]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen pb-32">
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>

      {/* Ambient Background Glow */}
      <div 
        className="category-glow" 
        style={{ '--glow-color': category.color } as React.CSSProperties} 
      />

      <Header />
      <CategoryPills />

      <main className="pt-44 px-6 md:px-10 max-w-7xl mx-auto">
        <motion.div 
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col mb-16 gap-8"
        >
          <div className="flex flex-col">
            <h2 
              className="font-display font-light text-5xl md:text-7xl lg:text-[90px] leading-[0.9] tracking-tightest text-white/95 mb-6"
            >
              {category.name}
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full glass flex items-center justify-center text-2xl shadow-2xl border-white/10">
                {category.emoji}
              </div>
              <p className="text-[11px] uppercase tracking-widest-luxury text-white/40 font-bold">
                {category.description}
              </p>
            </div>
          </div>
          
          <div className="h-px w-full bg-gradient-to-r from-white/20 to-transparent" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortBy('updated_at')}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border",
                  sortBy === 'updated_at' ? "bg-white/[0.08] text-white border-white/20" : "bg-transparent text-white/30 border-white/[0.05] hover:text-white/60 hover:border-white/10"
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Updated</span>
              </button>
              <button
                onClick={() => setSortBy('created_at')}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border",
                  sortBy === 'created_at' ? "bg-white/[0.08] text-white border-white/20" : "bg-transparent text-white/30 border-white/[0.05] hover:text-white/60 hover:border-white/10"
                )}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Created</span>
              </button>
              <button
                onClick={() => setSortBy('title')}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border",
                  sortBy === 'title' ? "bg-white/[0.08] text-white border-white/20" : "bg-transparent text-white/30 border-white/[0.05] hover:text-white/60 hover:border-white/10"
                )}
              >
                <span className="font-sans text-xs leading-none">A-Z</span>
                <span className="hidden sm:inline">Title</span>
              </button>
              <div className="w-px h-4 bg-white/[0.1] mx-2" />
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="p-2 rounded-full text-white/40 hover:text-white border border-transparent hover:border-white/[0.05] transition-all duration-300"
                title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortDirection === 'asc' ? <ArrowUpAZ className="w-4 h-4" /> : <ArrowDownAZ className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex flex-col items-end hidden sm:flex">
              <div className="text-[10px] uppercase tracking-widest-luxury font-black text-white/20">
                Workspace Status
              </div>
              <div className="text-xs font-mono text-white/40 mt-1">
                {items.length} {items.length === 1 ? 'Entry' : 'Entries'}
              </div>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border border-white/[0.05] border-t-white/40 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-white/5 rounded-full blur-xl"
              />
            </div>
            <p className="text-white/10 text-[10px] uppercase tracking-[0.3em] font-black">Accessing mOS Core...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-red-400 font-medium mb-2">Connection Error</h3>
              <p className="text-white/40 text-sm max-w-md mx-auto">
                {error?.includes('Failed to fetch') 
                  ? 'Could not connect to the database. Please check your Supabase credentials in the environment variables.'
                  : error}
              </p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center justify-center py-40 text-center"
          >
            <div className="w-24 h-24 rounded-[2.5rem] glass flex items-center justify-center mb-8 text-5xl shadow-2xl relative group">
              <div className="absolute inset-0 bg-white/[0.02] rounded-[2.5rem] blur-2xl group-hover:blur-3xl transition-all duration-700" />
              <span className="relative z-10 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
                {category.emoji}
              </span>
            </div>
            <h3 className="font-display font-light text-2xl mb-3 tracking-tight text-white/80">The workspace is currently empty</h3>
            <p className="text-white/20 text-xs max-w-[280px] leading-relaxed font-light tracking-wide">
              Initialize your first {category.name.toLowerCase()} by tapping the command button below.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className={cn(
              "grid gap-4 sm:gap-6",
              viewMode === 'cards' 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            )}
          >
            <AnimatePresence mode="popLayout">
              {sortedItems.map((item) => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  viewMode={viewMode}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <FAB />
      <AddItemSheet onAdd={addItem} onUpdate={updateItem} />
      <SearchOverlay />
      <ItemDetailsModal onUpdate={updateItem} onDelete={deleteItem} />
      <SettingsModal />

      {/* Mobile Bottom Nav Spacer */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg to-transparent pointer-events-none z-10" />
    </div>
  );
}
