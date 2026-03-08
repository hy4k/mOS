import { create } from 'zustand';
import { CategoryId } from '../lib/constants';
import { Item } from '../hooks/useItems';

export type SortField = 'title' | 'created_at' | 'updated_at';
export type SortDirection = 'asc' | 'desc';
export type SyncStatus = 'Syncing...' | 'Up to date' | 'Offline';

interface AppState {
  activeCategory: CategoryId;
  viewMode: 'cards' | 'compact';
  isSearchOpen: boolean;
  isAddItemOpen: boolean;
  isSettingsOpen: boolean;
  searchQuery: string;
  selectedItem: Item | null;
  editingItem: Item | null;
  sortBy: SortField;
  sortDirection: SortDirection;
  syncStatus: SyncStatus;
  setActiveCategory: (category: CategoryId) => void;
  setViewMode: (mode: 'cards' | 'compact') => void;
  setSearchOpen: (isOpen: boolean) => void;
  setAddItemOpen: (isOpen: boolean) => void;
  setSettingsOpen: (isOpen: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedItem: (item: Item | null) => void;
  setEditingItem: (item: Item | null) => void;
  setSortBy: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  setSyncStatus: (status: SyncStatus) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeCategory: 'quick',
  viewMode: 'cards',
  isSearchOpen: false,
  isAddItemOpen: false,
  isSettingsOpen: false,
  searchQuery: '',
  selectedItem: null,
  editingItem: null,
  sortBy: 'updated_at',
  sortDirection: 'desc',
  syncStatus: 'Up to date',
  setActiveCategory: (category) => set({ activeCategory: category }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
  setAddItemOpen: (isOpen) => set({ isAddItemOpen: isOpen }),
  setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedItem: (item) => set({ selectedItem: item }),
  setEditingItem: (item) => set({ editingItem: item }),
  setSortBy: (field) => set({ sortBy: field }),
  setSortDirection: (direction) => set({ sortDirection: direction }),
  setSyncStatus: (status) => set({ syncStatus: status }),
}));
