import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { CATEGORIES, CategoryId } from '../lib/constants';

export function useKeyboardShortcuts() {
  const { setSearchOpen, setActiveCategory, setAddItemOpen } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }

      // Ctrl/Cmd + N: New item
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setAddItemOpen(true);
      }

      // Ctrl/Cmd + 1-6: Switch categories
      if ((e.ctrlKey || e.metaKey) && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        const categoryIds = Object.keys(CATEGORIES) as CategoryId[];
        if (categoryIds[index]) {
          setActiveCategory(categoryIds[index]);
        }
      }

      // Escape: Close search/modals (handled by AnimatePresence/onClick usually, but good to have)
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setAddItemOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen, setActiveCategory, setAddItemOpen]);
}
