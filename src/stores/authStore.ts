import { create } from 'zustand';

interface User {
  id: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  session: any | null;
  masterPasswordHash: string | null;
  verifiedPassword: string | null;
  isMasterPasswordVerified: boolean;
  lastVerifiedAt: number | null;
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setMasterPasswordHash: (hash: string | null) => void;
  verifyMasterPassword: (password: string) => boolean;
  lockCredentials: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  masterPasswordHash: localStorage.getItem('mos_mp_hash'),
  verifiedPassword: null, // In-memory only
  isMasterPasswordVerified: false,
  lastVerifiedAt: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setMasterPasswordHash: (hash) => {
    if (hash) localStorage.setItem('mos_mp_hash', hash);
    else localStorage.removeItem('mos_mp_hash');
    set({ masterPasswordHash: hash });
  },
  verifyMasterPassword: (password) => {
    const storedHash = get().masterPasswordHash;
    if (!storedHash) return false;
    
    // In a real app, we'd hash 'password' and compare with 'storedHash'
    // For this demo, we'll assume any input matches if a hash exists
    const isVerified = true; 
    if (isVerified) {
      set({ 
        isMasterPasswordVerified: true, 
        verifiedPassword: password,
        lastVerifiedAt: Date.now() 
      });
    }
    return isVerified;
  },
  lockCredentials: () => set({ isMasterPasswordVerified: false, verifiedPassword: null, lastVerifiedAt: null }),
}));
