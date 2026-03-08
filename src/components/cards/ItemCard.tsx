import React from 'react';
import { motion } from 'motion/react';
import { Pin, Trash2, ExternalLink, Eye, EyeOff, Copy, Check, Edit2, Square, CheckSquare } from 'lucide-react';
import { Item } from '../../hooks/useItems';
import { CATEGORIES } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

import { encrypt, decrypt } from '../../lib/encryption';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { MasterPasswordPrompt } from '../modals/MasterPasswordPrompt';

interface ItemCardProps {
  item: Item;
  viewMode: 'cards' | 'compact';
  onUpdate: (id: string, updates: Partial<Item>) => void;
  onDelete: (id: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, viewMode, onUpdate, onDelete }) => {
  const category = CATEGORIES[item.category];
  const [isRevealed, setIsRevealed] = React.useState(false);
  const [isPromptOpen, setIsPromptOpen] = React.useState(false);
  const [decryptedContent, setDecryptedContent] = React.useState<string | null>(null);
  const { isMasterPasswordVerified, verifiedPassword } = useAuthStore();
  const { setSelectedItem, setAddItemOpen, setEditingItem } = useAppStore();
  const [copiedField, setCopiedField] = React.useState<'username' | 'password' | null>(null);

  const isCredential = item.category === 'credentials';

  const handleCopy = (text: string, field: 'username' | 'password', e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleReveal = () => {
    if (isRevealed) {
      setIsRevealed(false);
      return;
    }

    if (isMasterPasswordVerified && verifiedPassword) {
      const content = item.encrypted_content ? decrypt(item.encrypted_content, verifiedPassword) : item.content;
      setDecryptedContent(content);
      setIsRevealed(true);
    } else {
      setIsPromptOpen(true);
    }
  };

  const handlePromptSuccess = () => {
    setIsPromptOpen(false);
  };

  React.useEffect(() => {
    if (isMasterPasswordVerified && verifiedPassword && isRevealed && !decryptedContent) {
      const content = item.encrypted_content ? decrypt(item.encrypted_content, verifiedPassword) : item.content;
      setDecryptedContent(content);
    }
  }, [isMasterPasswordVerified, verifiedPassword, isRevealed, decryptedContent, item.encrypted_content, item.content]);

  const renderContent = () => {
    if (isCredential) {
      if (!isRevealed) {
        return (
          <p className="text-sm text-white/40 line-clamp-3 leading-relaxed font-light tracking-wide blur-lg select-none">
            {item.content}
          </p>
        );
      }
      
      try {
        const creds = JSON.parse(decryptedContent || '{}');
        return (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-2xl border border-white/[0.05] group/field">
              <span className="text-[10px] text-white/30 uppercase font-bold">User</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-white/80">{creds.username || 'N/A'}</span>
                {creds.username && (
                  <button
                    onClick={(e) => handleCopy(creds.username, 'username', e)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all opacity-0 group-hover/field:opacity-100"
                    title="Copy Username"
                  >
                    {copiedField === 'username' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-2xl border border-white/[0.05] group/field">
              <span className="text-[10px] text-white/30 uppercase font-bold">Pass</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-white/80">{creds.password || '••••••••'}</span>
                {creds.password && (
                  <button
                    onClick={(e) => handleCopy(creds.password, 'password', e)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all opacity-0 group-hover/field:opacity-100"
                    title="Copy Password"
                  >
                    {copiedField === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
            {creds.notes && (
              <p className="text-xs text-white/50 leading-relaxed font-light mt-3 italic">
                {creds.notes}
              </p>
            )}
          </div>
        );
      } catch (e) {
        return <p className="text-sm text-white/60 leading-relaxed font-light">{decryptedContent}</p>;
      }
    }

    if (item.category === 'links' && item.metadata?.url) {
      return (
        <div className="space-y-3 mb-4">
          <a 
            href={item.metadata.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors break-all bg-blue-500/5 p-3 rounded-2xl border border-blue-500/10"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{item.metadata.url}</span>
          </a>
          <p className="text-sm text-white/40 line-clamp-2 leading-relaxed font-light">
            {item.content}
          </p>
          {item.metadata.notes && (
            <p className="text-xs text-white/30 line-clamp-2 leading-relaxed font-light italic border-l-2 border-white/10 pl-3">
              {item.metadata.notes}
            </p>
          )}
        </div>
      );
    }

    if (item.category === 'people' && item.metadata?.date) {
      return (
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-purple-300/60 font-bold uppercase tracking-widest">
            <span>📅</span>
            <span>{new Date(item.metadata.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
          </div>
          <p className="text-sm text-white/40 line-clamp-2 leading-relaxed font-light">
            {item.content}
          </p>
        </div>
      );
    }

    if (item.category === 'numbers' && item.metadata) {
      return (
        <div className="space-y-3 mb-4">
          {item.metadata.bankAccount && (
            <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-2xl border border-white/[0.05] group/field">
              <span className="text-[10px] text-white/30 uppercase font-bold">Bank</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-white/80">{item.metadata.bankAccount}</span>
                <button
                  onClick={(e) => handleCopy(item.metadata.bankAccount, 'username', e)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all opacity-0 group-hover/field:opacity-100"
                  title="Copy Bank Account"
                >
                  {copiedField === 'username' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
          {item.metadata.phoneNumber && (
            <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-2xl border border-white/[0.05] group/field">
              <span className="text-[10px] text-white/30 uppercase font-bold">Phone</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-white/80">{item.metadata.phoneNumber}</span>
                <button
                  onClick={(e) => handleCopy(item.metadata.phoneNumber, 'password', e)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all opacity-0 group-hover/field:opacity-100"
                  title="Copy Phone Number"
                >
                  {copiedField === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
          <p className="text-sm text-white/40 line-clamp-2 leading-relaxed font-light mt-2">
            {item.content}
          </p>
        </div>
      );
    }

    if (item.category === 'todo') {
      const isCompleted = item.metadata?.completed || false;
      const quadrantColors = {
        do: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        schedule: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
        delegate: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        delete: 'text-red-400 bg-red-400/10 border-red-400/20'
      };
      const quadrantColor = item.metadata?.quadrant ? quadrantColors[item.metadata.quadrant as keyof typeof quadrantColors] : quadrantColors.do;

      return (
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(item.id, { metadata: { ...item.metadata, completed: !isCompleted } });
              }}
              className="text-white/40 hover:text-white transition-colors"
            >
              {isCompleted ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5" />}
            </button>
            <p className={cn(
              "text-sm leading-relaxed font-light flex-1",
              isCompleted ? "text-white/20 line-through" : "text-white/60"
            )}>
              {item.content}
            </p>
          </div>
          {item.metadata?.quadrant && (
            <div className={cn("inline-flex items-center px-2.5 py-1 rounded-md border text-[9px] font-bold uppercase tracking-widest", quadrantColor)}>
              {item.metadata.quadrant}
            </div>
          )}
        </div>
      );
    }

    if (item.category === 'quick') {
      return (
        <p className="text-sm text-black/70 line-clamp-3 leading-relaxed font-medium tracking-wide transition-all duration-500 group-hover:text-black/90 mb-4">
          {item.content}
        </p>
      );
    }

    return (
      <p className="text-sm text-white/40 line-clamp-3 leading-relaxed font-light tracking-wide transition-all duration-500 group-hover:text-white/60 mb-4">
        {item.content}
      </p>
    );
  };

  if (viewMode === 'compact') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ x: 4 }}
        className={cn(
          "p-4 rounded-2xl flex items-center justify-between group cursor-pointer transition-all duration-300",
          item.category === 'quick' 
            ? "bg-[#fdfbf7] border border-black/5 hover:bg-white text-black" 
            : "glass hover:bg-white/[0.05] text-white"
        )}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="w-1.5 h-8 rounded-full transition-all duration-500 group-hover:h-10" style={{ backgroundColor: category.color }} />
          <h3 className={cn("font-display font-medium text-sm truncate tracking-tight", item.category === 'quick' ? "text-black/90" : "text-white/90")}>{item.title}</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-0.5">
            <span className={cn("text-[9px] font-mono tracking-tighter", item.category === 'quick' ? "text-black/40" : "text-white/20")}>
              Updated: {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
            </span>
            <span className={cn("text-[9px] font-mono tracking-tighter", item.category === 'quick' ? "text-black/40" : "text-white/20")}>
              Created: {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
          </div>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setEditingItem(item);
              setAddItemOpen(true);
            }}
            className={cn("p-2 rounded-xl transition-all duration-300", item.category === 'quick' ? "hover:bg-black/5 text-black/20 hover:text-black" : "hover:bg-white/10 text-white/10 hover:text-white")}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onUpdate(item.id, { is_pinned: !item.is_pinned }); }}
            className={cn("p-2 rounded-xl transition-all duration-300", item.category === 'quick' ? (item.is_pinned ? "text-black hover:bg-black/5" : "text-black/20 hover:bg-black/5 hover:text-black") : (item.is_pinned ? "text-white hover:bg-white/10" : "text-white/10 hover:bg-white/10"))}
          >
            <Pin className={cn("w-3.5 h-3.5", item.is_pinned && "fill-current")} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={() => setSelectedItem(item)}
      className={cn(
        "p-6 sm:p-8 rounded-3xl relative overflow-hidden group cursor-pointer transition-all duration-500 border hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
        item.category === 'quick' 
          ? "bg-[#fdfbf7] border-black/5 hover:border-black/15 text-black" 
          : "bg-white/[0.02] backdrop-blur-3xl border-white/[0.05] hover:border-white/[0.15] text-white",
        item.is_pinned && (item.category === 'quick' ? "shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-black/10" : "border-white/[0.15] bg-white/[0.04] shadow-[0_20px_50px_rgba(0,0,0,0.3)]")
      )}
    >
      {item.is_pinned && (
        <div 
          className="absolute top-0 left-0 right-0 h-1.5 opacity-80" 
          style={{ backgroundColor: category.color }} 
        />
      )}

      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-2">
          <h3 className={cn("font-display font-light text-xl sm:text-2xl leading-tight tracking-tightest pr-10 transition-colors", item.category === 'quick' ? "text-black/90 group-hover:text-black" : "text-white/95 group-hover:text-white")}>
            {item.title}
          </h3>
          {item.due_date && (
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-red-400/80">
              <span>⏰ Due:</span>
              <span>{new Date(item.due_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
            </div>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setEditingItem(item);
              setAddItemOpen(true);
            }}
            className={cn("p-2.5 rounded-full transition-all duration-300 border border-transparent", item.category === 'quick' ? "hover:bg-black/5 text-black/40 hover:text-black hover:border-black/10" : "hover:bg-white/10 text-white/20 hover:text-white hover:border-white/10")}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onUpdate(item.id, { is_pinned: !item.is_pinned }); }}
            className={cn("p-2.5 rounded-full transition-all duration-300 border border-transparent", item.category === 'quick' ? (item.is_pinned ? "text-black hover:bg-black/5 hover:border-black/10" : "text-black/40 hover:bg-black/5 hover:text-black hover:border-black/10") : (item.is_pinned ? "text-white hover:bg-white/10 hover:border-white/10" : "text-white/20 hover:bg-white/10 hover:border-white/10"))}
          >
            <Pin className={cn("w-4 h-4", item.is_pinned && "fill-current")} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className={cn("p-2.5 rounded-full transition-all duration-300 border border-transparent", item.category === 'quick' ? "hover:bg-red-500/10 text-black/40 hover:text-red-500 hover:border-red-500/20" : "hover:bg-red-500/10 text-white/20 hover:text-red-400 hover:border-red-500/20")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        {renderContent()}
        
        {isCredential && (
          <button
            onClick={handleReveal}
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-500",
              isRevealed ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"
            )}
          >
            <div className="bg-white/[0.05] backdrop-blur-3xl px-6 py-3 rounded-full flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest border border-white/[0.1] shadow-2xl">
              <Eye className="w-4 h-4" />
              Reveal
            </div>
          </button>
        )}

        {isCredential && isRevealed && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsRevealed(false); }}
            className="absolute top-0 right-0 p-2 text-white/20 hover:text-white transition-colors"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className={cn("flex items-center justify-between mt-auto pt-6 border-t", item.category === 'quick' ? "border-black/5" : "border-white/[0.05]")}>
        <div className="flex gap-2 flex-wrap">
          {item.tags?.map((tag, idx) => (
            <span 
              key={`${item.id}-tag-${tag}-${idx}`} 
              className={cn("text-[9px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-full bg-transparent border transition-all duration-300", item.category === 'quick' ? "border-black/10 group-hover:border-black/20" : "border-white/[0.1] group-hover:border-white/[0.2]")}
              style={{ color: category.color }}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn("text-[10px] font-sans tracking-widest uppercase transition-colors", item.category === 'quick' ? "text-black/40 group-hover:text-black/60" : "text-white/20 group-hover:text-white/40")}>
            Updated: {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
          </span>
          <span className={cn("text-[10px] font-sans tracking-widest uppercase transition-colors", item.category === 'quick' ? "text-black/40 group-hover:text-black/60" : "text-white/20 group-hover:text-white/40")}>
            Created: {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Subtle background glow on hover */}
      <div 
        className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle at 100% 100%, ${category.color} 0%, transparent 50%)` }}
      />

      <MasterPasswordPrompt 
        isOpen={isPromptOpen} 
        onClose={() => setIsPromptOpen(false)} 
        onSuccess={handlePromptSuccess} 
      />
    </motion.div>
  );
};
