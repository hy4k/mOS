import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Tag, Pin, Sparkles, Loader2 } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { CATEGORIES, CategoryId } from '../../lib/constants';
import { cn } from '../../lib/utils';

import { encrypt, decrypt } from '../../lib/encryption';
import { useAuthStore } from '../../stores/authStore';
import { MasterPasswordPrompt } from '../modals/MasterPasswordPrompt';
import { parseMagicInput } from '../../services/geminiService';

import { Item } from '../../hooks/useItems';

interface AddItemSheetProps {
  onAdd: (item: any) => void;
  onUpdate: (id: string, updates: Partial<Item>) => void;
}

export const AddItemSheet: React.FC<AddItemSheetProps> = ({ onAdd, onUpdate }) => {
  const { isAddItemOpen, setAddItemOpen, activeCategory, editingItem, setEditingItem, isMagicModeOpen, setMagicModeOpen } = useAppStore();
  const { isMasterPasswordVerified, verifiedPassword } = useAuthStore();
  
  // Magic Mode
  const [magicInput, setMagicInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Generic fields
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>(activeCategory);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [promptReason, setPromptReason] = useState<'load' | 'save' | null>(null);

  // Dynamic fields
  const [content, setContent] = useState(''); // Used for Quick Notes, Ideas, and general notes
  const [notes, setNotes] = useState(''); // Used for Links
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [quadrant, setQuadrant] = useState<'do' | 'schedule' | 'delegate' | 'delete'>('do');

  const category = CATEGORIES[selectedCategory];

  // Sync selected category with active category when sheet opens
  React.useEffect(() => {
    if (isAddItemOpen) {
      if (editingItem) {
        setSelectedCategory(editingItem.category);
        setTitle(editingItem.title);
        setTags(editingItem.tags ? editingItem.tags.join(', ') : '');
        setIsPinned(editingItem.is_pinned);
        setDueDate(editingItem.due_date ? new Date(editingItem.due_date).toISOString().slice(0, 16) : '');
        
        if (editingItem.category === 'credentials') {
          if (editingItem.encrypted_content) {
            if (isMasterPasswordVerified && verifiedPassword) {
              try {
                const decrypted = decrypt(editingItem.encrypted_content, verifiedPassword);
                const creds = JSON.parse(decrypted);
                setUsername(creds.username || '');
                setPassword(creds.password || '');
                setContent(creds.notes || '');
              } catch (e) {
                console.error("Failed to decrypt for editing", e);
              }
            } else {
              setPromptReason('load');
              setIsPromptOpen(true);
            }
          } else {
             try {
                const creds = JSON.parse(editingItem.content || '{}');
                setUsername(creds.username || '');
                setPassword(creds.password || '');
                setContent(creds.notes || '');
             } catch(e) {
                setContent(editingItem.content || '');
             }
          }
        } else if (editingItem.category === 'links') {
          setUrl(editingItem.metadata?.url || '');
          setNotes(editingItem.metadata?.notes || '');
          setContent(editingItem.content || '');
        } else if (editingItem.category === 'people') {
          setDate(editingItem.metadata?.date || '');
          setContent(editingItem.content || '');
        } else if (editingItem.category === 'numbers') {
          setBankAccount(editingItem.metadata?.bankAccount || '');
          setPhoneNumber(editingItem.metadata?.phoneNumber || '');
          setContent(editingItem.content || '');
        } else if (editingItem.category === 'todo') {
          setQuadrant(editingItem.metadata?.quadrant || 'do');
          setContent(editingItem.content || '');
        } else {
          setContent(editingItem.content || '');
        }
      } else {
        setSelectedCategory(activeCategory);
        // Reset fields
        setMagicInput('');
        setTitle('');
        setContent('');
        setNotes('');
        setTags('');
        setUrl('');
        setUsername('');
        setPassword('');
        setDate('');
        setDueDate('');
        setBankAccount('');
        setPhoneNumber('');
        setQuadrant('do');
        setIsPinned(false);
      }
    } else {
      setTimeout(() => {
        if (!useAppStore.getState().isAddItemOpen) {
          setEditingItem(null);
        }
      }, 300);
    }
  }, [isAddItemOpen, activeCategory, editingItem, isMasterPasswordVerified, verifiedPassword, setEditingItem]);

  const handleMagicParse = async () => {
    if (!magicInput.trim()) return;
    
    setIsParsing(true);
    try {
      const parsed = await parseMagicInput(magicInput);
      if (parsed) {
        if (parsed.category && CATEGORIES[parsed.category as CategoryId]) {
          setSelectedCategory(parsed.category as CategoryId);
        }
        if (parsed.title) setTitle(parsed.title);
        if (parsed.content) setContent(parsed.content);
        if (parsed.tags && Array.isArray(parsed.tags)) setTags(parsed.tags.join(', '));
        
        if (parsed.metadata) {
          if (parsed.metadata.username) setUsername(parsed.metadata.username);
          if (parsed.metadata.password) setPassword(parsed.metadata.password);
          if (parsed.metadata.url) setUrl(parsed.metadata.url);
          if (parsed.metadata.notes) setNotes(parsed.metadata.notes);
          if (parsed.metadata.bankAccount) setBankAccount(parsed.metadata.bankAccount);
          if (parsed.metadata.phoneNumber) setPhoneNumber(parsed.metadata.phoneNumber);
          if (parsed.metadata.date) setDate(parsed.metadata.date);
          if (parsed.metadata.due_date) setDueDate(parsed.metadata.due_date);
        }
        
        setMagicModeOpen(false);
      }
    } catch (error) {
      console.error("Magic parse failed", error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = () => {
    if (!title.trim() && selectedCategory !== 'quick') return;

    if (selectedCategory === 'credentials' && (!isMasterPasswordVerified || !verifiedPassword)) {
      setPromptReason('save');
      setIsPromptOpen(true);
      return;
    }

    const finalTitle = title.trim() || (selectedCategory === 'quick' ? 'Untitled Note' : 'Untitled');
    const metadata: any = {};
    let finalContent = content;

    // Category specific logic
    if (selectedCategory === 'links') {
      metadata.url = url;
      metadata.notes = notes;
      finalContent = content; // Description
    } else if (selectedCategory === 'credentials') {
      metadata.username = username;
      // Password will be encrypted with content
      const credContent = JSON.stringify({ username, password, notes: content });
      finalContent = credContent;
    } else if (selectedCategory === 'people') {
      metadata.date = date;
      finalContent = content;
    } else if (selectedCategory === 'numbers') {
      metadata.bankAccount = bankAccount;
      metadata.phoneNumber = phoneNumber;
      finalContent = content;
    } else if (selectedCategory === 'todo') {
      metadata.quadrant = quadrant;
      metadata.completed = false; // Initial state
      finalContent = content;
    }

    const itemData: any = {
      title: finalTitle,
      category: selectedCategory,
      tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
      is_pinned: isPinned,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      metadata
    };

    if (selectedCategory === 'credentials' && verifiedPassword) {
      itemData.encrypted_content = encrypt(finalContent, verifiedPassword);
      itemData.content = 'Encrypted Credential';
    } else {
      itemData.content = finalContent;
    }
    
    if (editingItem) {
      onUpdate(editingItem.id, itemData);
    } else {
      onAdd(itemData);
    }

    // Reset and close
    setTitle('');
    setContent('');
    setNotes('');
    setTags('');
    setUrl('');
    setUsername('');
    setPassword('');
    setDate('');
    setDueDate('');
    setBankAccount('');
    setPhoneNumber('');
    setQuadrant('do');
    setIsPinned(false);
    setAddItemOpen(false);
  };

  const handlePromptSuccess = () => {
    setIsPromptOpen(false);
    if (promptReason === 'save') {
      handleSave();
    }
    setPromptReason(null);
  };

  const renderFields = () => {
    switch (selectedCategory) {
      case 'links':
        return (
          <>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white/5 border border-white/20 shadow-sm rounded-2xl px-6 py-4 text-base font-light text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">Description</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What is this link about?"
                rows={2}
                className="w-full bg-white/5 border border-white/20 shadow-sm rounded-2xl px-6 py-4 text-base font-light text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500 resize-none"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
                className="w-full bg-white/5 border border-white/20 shadow-sm rounded-2xl px-6 py-4 text-base font-light text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500 resize-none"
              />
            </div>
          </>
        );
      case 'credentials':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">Username / Email</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-white/5 border border-white/20 shadow-sm rounded-2xl px-6 py-4 text-base font-light text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/20 shadow-sm rounded-2xl px-6 py-4 text-base font-light text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">Additional Notes</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Security questions, recovery codes..."
                rows={2}
                className="w-full bg-white/5 border border-white/20 shadow-sm rounded-2xl px-6 py-4 text-base font-light text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500 resize-none"
              />
            </div>
          </>
        );
      case 'people':
        return (
          <>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/5 border border-white/20 shadow-sm rounded-2xl px-6 py-4 text-base font-light text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500 [color-scheme:dark]"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">Notes</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Gift ideas, how you met..."
                rows={3}
                className="w-full bg-white/5 border border-white/20 shadow-sm rounded-2xl px-6 py-4 text-base font-light text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500 resize-none"
              />
            </div>
          </>
        );
      case 'numbers':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">Bank Account</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="Account Number..."
                  className="w-full bg-white/5 border border-white/20 shadow-sm rounded-2xl px-6 py-4 text-base font-light text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full bg-white/5 border border-white/20 shadow-sm rounded-2xl px-6 py-4 text-base font-light text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">Notes</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Context for this data..."
                rows={2}
                className="w-full bg-white/5 border border-white/20 shadow-sm rounded-2xl px-6 py-4 text-base font-light text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500 resize-none"
              />
            </div>
          </>
        );
      case 'todo':
        return (
          <>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">Quadrant</label>
              <div className="grid grid-cols-2 gap-4">
                {(['do', 'schedule', 'delegate', 'delete'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuadrant(q)}
                    className={cn(
                      "py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all duration-300",
                      quadrant === q 
                        ? "bg-white/[0.08] border-white/[0.2] text-white" 
                        : "bg-white/[0.02] border-white/[0.05] text-white/30 hover:text-white/60"
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">Task Details</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe the task..."
                rows={3}
                className="w-full bg-white/5 border border-white/20 shadow-sm rounded-2xl px-6 py-4 text-base font-light text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500 resize-none"
              />
            </div>
          </>
        );
      default: // quick and ideas
        return (
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={category.placeholder}
              rows={6}
              className="w-full bg-white/5 border border-white/20 shadow-sm rounded-2xl px-6 py-4 text-base font-light text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500 resize-none leading-relaxed"
            />
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isAddItemOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAddItemOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-bg/95 backdrop-blur-3xl rounded-t-[2rem] p-6 md:p-10 max-h-[90vh] overflow-y-auto border-t border-white/[0.05] shadow-[0_-20px_80px_rgba(0,0,0,0.8)] max-w-4xl mx-auto"
          >
            <div className="w-12 h-1 bg-white/[0.1] rounded-full mx-auto mb-8" />
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/[0.02] border border-white/[0.1] flex items-center justify-center text-2xl md:text-3xl shadow-2xl">
                  {category.emoji}
                </div>
                <div className="flex flex-col">
                  <h2 className="font-display font-light text-3xl md:text-4xl tracking-tight text-white/95 leading-tight">
                    {editingItem ? 'Edit' : 'New'} <span style={{ color: category.color }} className="font-bold italic">{category.name}</span>
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest-luxury text-white/30 font-bold mt-2">
                    {editingItem ? 'Update Protocol Initialized' : 'Entry Protocol Initialized'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setAddItemOpen(false)}
                  className="p-4 rounded-full hover:bg-white/10 text-white/20 hover:text-white transition-all duration-500 border border-transparent hover:border-white/10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="space-y-10 max-w-3xl mx-auto">
              <AnimatePresence mode="wait">
                {isMagicModeOpen ? (
                  <motion.div
                    key="magic-mode"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    <div className="p-8 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 space-y-6 relative overflow-hidden backdrop-blur-xl">
                      {/* Accent glow for AI mode */}
                      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="flex items-center gap-3 text-indigo-400">
                        <Sparkles className="w-5 h-5" />
                        <h3 className="font-display text-lg uppercase tracking-widest-luxury font-black">AI Command Center</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <textarea
                          autoFocus
                          value={magicInput}
                          onChange={(e) => setMagicInput(e.target.value)}
                          placeholder={`Instruct Gemini to fill these columns, e.g., "Note about my vacation planning starting from July 10th..."`}
                          rows={3}
                          className="w-full bg-black/40 border border-indigo-500/20 rounded-[1.5rem] px-6 py-5 text-base font-light text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-all duration-500 resize-none shadow-inner"
                        />
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">
                            Powered by Gemini 2.0 Flash
                          </p>
                          <button
                            onClick={handleMagicParse}
                            disabled={isParsing || !magicInput.trim()}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(99,102,241,0.3)]"
                          >
                            {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {isParsing ? 'Analyzing...' : 'Parse Columns'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* AI Enhancement Columns Display */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-4">
                        <h4 className="text-[10px] uppercase tracking-widest-luxury font-black text-white/20">Target Columns</h4>
                        <div className="h-px flex-1 mx-6 bg-white/[0.05]" />
                      </div>
                      
                      <div className="ai-columns-grid">
                        <div className="ai-column-item">
                          <label className="ai-column-label">Entry Title</label>
                          <input 
                            type="text" 
                            disabled 
                            value={title} 
                            placeholder="Awaiting extraction..." 
                            className="ai-column-input opacity-50 italic"
                          />
                        </div>
                        {selectedCategory === 'links' && (
                          <div className="ai-column-item">
                            <label className="ai-column-label">URL / Endpoint</label>
                            <input type="text" disabled value={url} placeholder="https://..." className="ai-column-input opacity-50 italic" />
                          </div>
                        )}
                        {selectedCategory === 'credentials' && (
                          <>
                            <div className="ai-column-item">
                              <label className="ai-column-label">Identity / Login</label>
                              <input type="text" disabled value={username} placeholder="user@..." className="ai-column-input opacity-50 italic" />
                            </div>
                            <div className="ai-column-item">
                              <label className="ai-column-label">Access Protocol</label>
                              <input type="text" disabled value={password} placeholder="••••••••" className="ai-column-input opacity-50 italic" />
                            </div>
                          </>
                        )}
                        <div className="ai-column-item">
                          <label className="ai-column-label">Primary Fragment</label>
                          <div className="ai-column-input min-h-[50px] opacity-50 italic overflow-hidden truncate">
                            {content || 'Awaiting content...'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 flex gap-5">
                      <button
                        onClick={() => setAddItemOpen(false)}
                        className="flex-1 py-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.08] text-white/30 font-bold uppercase tracking-widest text-xs transition-all duration-500 border border-white/[0.05]"
                      >
                        Abort
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="flex-[2] py-4 rounded-2xl font-black text-white uppercase tracking-widest text-xs shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-500 hover:brightness-110 active:scale-[0.98] relative overflow-hidden group disabled:opacity-50"
                        style={{ background: `linear-gradient(135deg, ${category.color}, ${category.color}cc)` }}
                      >
                        <span className="relative z-10">Commit AI Structure</span>
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="manual-mode"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-10"
                  >
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">
                        {selectedCategory === 'links' ? 'Website Name' : 
                         selectedCategory === 'people' ? 'Person / Event' : 
                         selectedCategory === 'numbers' ? 'Bank / Phone Name' : 
                         'Title'}
                      </label>
                      <input
                        autoFocus
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Identify this entry..."
                        className="w-full bg-white/5 border border-white/20 shadow-sm rounded-2xl px-6 py-4 text-xl font-display font-light text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500"
                      />
                    </div>

                    {renderFields()}

                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">Due Date (Optional)</label>
                      <input
                        type="datetime-local"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 shadow-sm rounded-2xl px-6 py-4 text-base font-light text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500 [color-scheme:dark]"
                      />
                    </div>

                    <div className="flex gap-8">
                      <div className="flex-1 space-y-3">
                        <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">Tags</label>
                        <div className="relative group">
                          <Tag className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within:text-white/30 transition-colors" />
                          <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="dev, work, personal..."
                            className="w-full bg-white/5 border border-white/20 shadow-sm rounded-2xl pl-14 pr-6 py-4 text-base font-light text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-widest-luxury font-black text-white/10 ml-1">Pin</label>
                        <button
                          onClick={() => setIsPinned(!isPinned)}
                          className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border shadow-2xl",
                            isPinned 
                              ? "bg-white/[0.08] border-white/[0.2] text-white" 
                              : "bg-white/[0.02] border-white/[0.05] text-white/10 hover:border-white/[0.1] hover:text-white/30"
                          )}
                        >
                          <Pin className={cn("w-6 h-6 transition-transform duration-500", isPinned && "fill-current scale-110")} />
                        </button>
                      </div>
                    </div>

                    <div className="pt-8 flex gap-5">
                      <button
                        onClick={() => setAddItemOpen(false)}
                        className="flex-1 py-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.08] text-white/30 font-bold uppercase tracking-widest text-xs transition-all duration-500 border border-white/[0.05]"
                      >
                        Abort
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex-[2] py-4 rounded-2xl font-black text-white uppercase tracking-widest text-xs shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-500 hover:brightness-110 active:scale-[0.98] relative overflow-hidden group"
                        style={{ background: `linear-gradient(135deg, ${category.color}, ${category.color}cc)` }}
                      >
                        <span className="relative z-10">{editingItem ? 'Update Entry' : 'Commit Entry'}</span>
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Subtle background glow */}
            <div 
              className="absolute inset-0 -z-10 opacity-5 pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 100%, ${category.color} 0%, transparent 70%)` }}
            />
          </motion.div>
        </>
      )}
      <MasterPasswordPrompt 
        isOpen={isPromptOpen} 
        onClose={() => setIsPromptOpen(false)} 
        onSuccess={handlePromptSuccess} 
      />
    </AnimatePresence>
  );
};
