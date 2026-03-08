import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface MasterPasswordPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MasterPasswordPrompt: React.FC<MasterPasswordPromptProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { verifyMasterPassword, masterPasswordHash, setMasterPasswordHash } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!masterPasswordHash) {
      // First time setup
      setMasterPasswordHash(password); // In real app, hash it
      onSuccess();
      return;
    }

    if (verifyMasterPassword(password)) {
      onSuccess();
      setPassword('');
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] w-full max-w-md p-6"
          >
            <div className="glass-elevated p-8 rounded-[32px] text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10">
                <Lock className="w-8 h-8 text-[#EE4266]" />
              </div>
              
              <h2 className="font-display font-bold text-2xl mb-2">
                {masterPasswordHash ? 'Unlock Data' : 'Set Master Password'}
              </h2>
              <p className="text-white/40 text-sm mb-8">
                {masterPasswordHash 
                  ? 'Enter your master password to access encrypted credentials.' 
                  : 'Create a master password to secure your sensitive data locally.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <motion.div
                  animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <input
                    autoFocus
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Master Password"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-center text-white placeholder:text-white/20 focus:outline-none focus:border-[#EE4266]/50 transition-all"
                  />
                </motion.div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-4 rounded-2xl bg-[#EE4266] font-bold text-white shadow-lg shadow-[#EE4266]/20 transition-all hover:brightness-110 active:scale-[0.98]"
                  >
                    {masterPasswordHash ? 'Unlock' : 'Set Password'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
