import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Pin, Trash2, ExternalLink, Eye, EyeOff, Calendar, Clock, Tag as TagIcon } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { CATEGORIES } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { useAuthStore } from '../../stores/authStore';
import { encrypt, decrypt } from '../../lib/encryption';
import { MasterPasswordPrompt } from './MasterPasswordPrompt';

interface ItemDetailsModalProps {
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ onUpdate, onDelete }) => {
  const { selectedItem, setSelectedItem } = useAppStore();
  const { isMasterPasswordVerified, verifiedPassword } = useAuthStore();
  
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedItem) {
      setIsRevealed(false);
      setDecryptedContent(null);
    }
  }, [selectedItem]);

  useEffect(() => {
    if (selectedItem && isMasterPasswordVerified && verifiedPassword && isRevealed && !decryptedContent) {
      const content = selectedItem.encrypted_content 
        ? decrypt(selectedItem.encrypted_content, verifiedPassword) 
        : selectedItem.content;
      setDecryptedContent(content);
    }
  }, [selectedItem, isMasterPasswordVerified, verifiedPassword, isRevealed, decryptedContent]);

  if (!selectedItem) return null;

  const category = CATEGORIES[selectedItem.category];
  const isCredential = selectedItem.category === 'credentials';

  const handleReveal = () => {
    if (isRevealed) {
      setIsRevealed(false);
      setDecryptedContent(null);
    } else {
      if (!isMasterPasswordVerified || !verifiedPassword) {
        setIsPromptOpen(true);
      } else {
        setIsRevealed(true);
      }
    }
  };

  const handlePromptSuccess = () => {
    setIsPromptOpen(false);
  };

  const handleDelete = () => {
    onDelete(selectedItem.id);
    setSelectedItem(null);
  };

  const handleTogglePin = () => {
    onUpdate(selectedItem.id, { is_pinned: !selectedItem.is_pinned });
    setSelectedItem({ ...selectedItem, is_pinned: !selectedItem.is_pinned });
  };

  const renderContent = () => {
    if (isCredential) {
      if (!isRevealed) {
        return (
          <div className="relative">
            <p className="text-lg text-white/40 leading-relaxed font-light tracking-wide blur-xl select-none min-h-[100px]">
              {selectedItem.content}
            </p>
            <button
              onClick={handleReveal}
              className="absolute inset-0 flex items-center justify-center transition-all duration-500 group"
            >
              <div className="bg-white/[0.05] backdrop-blur-3xl px-6 py-3 rounded-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest border border-white/[0.05] shadow-2xl group-hover:bg-white/[0.1] transition-colors">
                <Eye className="w-5 h-5" />
                Reveal Secure Data
              </div>
            </button>
          </div>
        );
      }
      
      try {
        const creds = JSON.parse(decryptedContent || '{}');
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05]">
              <span className="text-xs text-white/30 uppercase font-bold tracking-widest">Username / Email</span>
              <span className="text-base font-mono text-white/90 select-all">{creds.username || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05]">
              <span className="text-xs text-white/30 uppercase font-bold tracking-widest">Password</span>
              <span className="text-base font-mono text-white/90 select-all">{creds.password || '••••••••'}</span>
            </div>
            {creds.notes && (
              <div className="mt-6">
                <span className="text-xs text-white/30 uppercase font-bold tracking-widest block mb-2">Secure Notes</span>
                <p className="text-base text-white/70 leading-relaxed font-light whitespace-pre-wrap bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05]">
                  {creds.notes}
                </p>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setIsRevealed(false)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/[0.05]"
              >
                <EyeOff className="w-4 h-4" />
                Hide Data
              </button>
            </div>
          </div>
        );
      } catch (e) {
        return <p className="text-lg text-white/80 leading-relaxed font-light whitespace-pre-wrap">{decryptedContent}</p>;
      }
    }

    if (selectedItem.category === 'links' && selectedItem.metadata?.url) {
      return (
        <div className="space-y-6">
          <a 
            href={selectedItem.metadata.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-base text-blue-400 hover:text-blue-300 transition-colors break-all bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10 group"
          >
            <ExternalLink className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
            <span>{selectedItem.metadata.url}</span>
          </a>
          {selectedItem.content && (
            <div>
              <span className="text-xs text-white/30 uppercase font-bold tracking-widest block mb-2">Description</span>
              <p className="text-lg text-white/80 leading-relaxed font-light whitespace-pre-wrap">
                {selectedItem.content}
              </p>
            </div>
          )}
          {selectedItem.metadata.notes && (
            <div>
              <span className="text-xs text-white/30 uppercase font-bold tracking-widest block mb-2">Notes</span>
              <p className="text-base text-white/60 leading-relaxed font-light whitespace-pre-wrap italic border-l-2 border-white/10 pl-4">
                {selectedItem.metadata.notes}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedItem.category === 'people' && selectedItem.metadata?.date) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-sm text-purple-300/80 font-bold uppercase tracking-widest bg-purple-500/5 p-4 rounded-2xl border border-purple-500/10">
            <Calendar className="w-5 h-5" />
            <span>{new Date(selectedItem.metadata.date).toLocaleDateString(undefined, { dateStyle: 'full' })}</span>
          </div>
          {selectedItem.content && (
            <div>
              <span className="text-xs text-white/30 uppercase font-bold tracking-widest block mb-2">Notes</span>
              <p className="text-lg text-white/80 leading-relaxed font-light whitespace-pre-wrap">
                {selectedItem.content}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedItem.category === 'numbers' && (selectedItem.metadata?.bankAccount || selectedItem.metadata?.phoneNumber)) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedItem.metadata.bankAccount && (
              <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/[0.05]">
                <span className="text-xs text-white/30 uppercase font-bold tracking-widest block mb-2">Bank Account</span>
                <span className="text-2xl font-mono text-white select-all">{selectedItem.metadata.bankAccount}</span>
              </div>
            )}
            {selectedItem.metadata.phoneNumber && (
              <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/[0.05]">
                <span className="text-xs text-white/30 uppercase font-bold tracking-widest block mb-2">Phone Number</span>
                <span className="text-2xl font-mono text-white select-all">{selectedItem.metadata.phoneNumber}</span>
              </div>
            )}
          </div>
          {selectedItem.content && (
            <div>
              <span className="text-xs text-white/30 uppercase font-bold tracking-widest block mb-2">Context</span>
              <p className="text-lg text-white/80 leading-relaxed font-light whitespace-pre-wrap">
                {selectedItem.content}
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <p className="text-lg text-white/90 leading-relaxed font-light tracking-wide whitespace-pre-wrap">
        {selectedItem.content}
      </p>
    );
  };

  return (
    <AnimatePresence>
      {selectedItem && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[90] md:w-full md:max-w-2xl max-h-[90vh] flex flex-col bg-bg/95 backdrop-blur-3xl rounded-[2rem] border border-white/[0.1] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 md:p-10 border-b border-white/[0.05] relative shrink-0">
              <div 
                className="absolute top-0 left-0 right-0 h-1.5 opacity-80" 
                style={{ backgroundColor: category.color }} 
              />
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full glass flex items-center justify-center text-2xl md:text-3xl shadow-xl border-white/10 shrink-0">
                  {category.emoji}
                </div>
                <div>
                  <h2 className="font-display font-light text-3xl md:text-4xl tracking-tight text-white/95">
                    {selectedItem.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-[10px] uppercase tracking-widest-luxury font-bold" style={{ color: category.color }}>
                      {category.name}
                    </p>
                    {selectedItem.due_date && (
                      <>
                        <span className="text-white/20">•</span>
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-red-400/80">
                          <Clock className="w-3 h-3" />
                          <span>Due: {new Date(selectedItem.due_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleTogglePin}
                  className={cn("p-3 rounded-full hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-white/10", selectedItem.is_pinned ? "text-white bg-white/[0.05]" : "text-white/20")}
                  title={selectedItem.is_pinned ? "Unpin" : "Pin"}
                >
                  <Pin className={cn("w-5 h-5", selectedItem.is_pinned && "fill-current")} />
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-3 rounded-full hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all duration-300 border border-transparent hover:border-red-500/20"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-white/[0.1] mx-2" />
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="p-3 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all duration-300 border border-transparent hover:border-white/10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-10 overflow-y-auto no-scrollbar flex-1">
              {renderContent()}
            </div>

            {/* Footer Metadata */}
            <div className="p-6 md:px-10 md:py-6 bg-black/20 border-t border-white/[0.05] shrink-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {selectedItem.tags && selectedItem.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 items-center">
                    <TagIcon className="w-4 h-4 text-white/20 mr-1" />
                    {selectedItem.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                        style={{ color: category.color }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/20 flex items-center gap-2">
                    <TagIcon className="w-4 h-4" /> No Tags
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-[10px] font-mono tracking-tighter text-white/30">
                  <div className="flex items-center gap-1.5" title="Created">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(selectedItem.created_at), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-1.5" title="Last Updated">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(selectedItem.updated_at), 'HH:mm')}
                  </div>
                </div>
              </div>
            </div>

            {/* Ambient Glow */}
            <div 
              className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 0%, ${category.color} 0%, transparent 70%)` }}
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
