import { useEffect, useState } from 'react';
import { CategoryId } from '../lib/constants';
import { supabase } from '../lib/supabaseClient';
import { useAppStore } from '../stores/appStore';

export interface Item {
  id: string;
  user_id: string;
  category: CategoryId;
  title: string;
  content: string;
  encrypted_content?: string;
  tags: string[];
  is_pinned: boolean;
  is_archived: boolean;
  metadata: any;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export function useItems(category?: CategoryId) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      useAppStore.getState().setSyncStatus('Syncing...');
      
      let query = supabase
        .from('items')
        .select('*')
        .order('updated_at', { ascending: false });
        
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      setItems(data as Item[]);
      useAppStore.getState().setSyncStatus('Up to date');
    } catch (err: any) {
      setError(err.message);
      useAppStore.getState().setSyncStatus('Offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    const handleOnline = () => {
      useAppStore.getState().setSyncStatus('Up to date');
      fetchItems();
    };
    
    const handleOffline = () => {
      useAppStore.getState().setSyncStatus('Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [category]);

  const addItem = async (item: Partial<Item>) => {
    try {
      useAppStore.getState().setSyncStatus('Syncing...');
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('You must be logged in to add items');

      const newItem = {
        ...item,
        user_id: userData.user.id,
      };

      const { data, error: insertError } = await supabase
        .from('items')
        .insert([newItem])
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      setItems(prev => {
        const exists = prev.some(i => i.id === data.id);
        if (exists) return prev;
        return [data as Item, ...prev];
      });
      useAppStore.getState().setSyncStatus('Up to date');
      return data as Item;
    } catch (err: any) {
      setError(err.message);
      useAppStore.getState().setSyncStatus('Offline');
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<Item>) => {
    try {
      useAppStore.getState().setSyncStatus('Syncing...');
      // Optimistic update
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } as Item : i));
      
      const { error: updateError } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id);
        
      if (updateError) {
        // Revert on failure
        fetchItems();
        throw updateError;
      }
      useAppStore.getState().setSyncStatus('Up to date');
    } catch (err: any) {
      setError(err.message);
      useAppStore.getState().setSyncStatus('Offline');
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      useAppStore.getState().setSyncStatus('Syncing...');
      // Optimistic update
      setItems(prev => prev.filter(i => i.id !== id));
      
      const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .eq('id', id);
        
      if (deleteError) {
        // Revert on failure
        fetchItems();
        throw deleteError;
      }
      useAppStore.getState().setSyncStatus('Up to date');
    } catch (err: any) {
      setError(err.message);
      useAppStore.getState().setSyncStatus('Offline');
      throw err;
    }
  };

  const importItems = async (itemsToImport: Partial<Item>[]) => {
    try {
      useAppStore.getState().setSyncStatus('Syncing...');
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('You must be logged in to import items');

      const itemsWithUser = itemsToImport.map(item => ({
        ...item,
        user_id: userData.user.id,
      }));

      const { error: importError } = await supabase
        .from('items')
        .upsert(itemsWithUser);
        
      if (importError) throw importError;
      
      await fetchItems();
      useAppStore.getState().setSyncStatus('Up to date');
    } catch (err: any) {
      setError(err.message);
      useAppStore.getState().setSyncStatus('Offline');
      throw err;
    }
  };

  return { items, loading, error, addItem, updateItem, deleteItem, importItems, refresh: fetchItems };
}
