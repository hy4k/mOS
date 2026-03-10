import React, { useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabaseClient';
import { Mail, KeyRound, ArrowRight, Loader2 } from 'lucide-react';

const CATEGORY_COLORS = ['#FF6B35', '#00D4AA', '#FFD23F', '#EE4266', '#A78BFA', '#3B82F6'];

const FloatingOrbs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-bg z-0" />
      {CATEGORY_COLORS.map((color, i) => (
        <motion.div
          key={color}
          className="absolute w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] rounded-full mix-blend-screen z-10"
          style={{ 
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            left: `${(i % 3) * 30}%`,
            top: `${Math.floor(i / 3) * 40}%`,
          }}
          animate={{
            x: ['-10%', '10%', '-10%'],
            y: ['-10%', '10%', '-10%'],
            scale: [0.8, 1.2, 0.8],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
      <div className="absolute inset-0 backdrop-blur-[100px] z-20" />
    </div>
  );
};

const MOSLogo = () => (
  <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
    {/* Animated background glow using category colors */}
    <motion.div 
      className="absolute inset-0 blur-3xl opacity-30 rounded-full" 
      style={{
        background: 'conic-gradient(from 0deg, #FF6B35, #FFD23F, #00D4AA, #3B82F6, #A78BFA, #EE4266, #FF6B35)'
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
    />
    
    {/* Logo container */}
    <div className="relative w-full h-full bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl flex items-center justify-center overflow-hidden group">
      {/* Inner gradient ring */}
      <div 
        className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700" 
        style={{
          background: 'conic-gradient(from 0deg, #FF6B35, #FFD23F, #00D4AA, #3B82F6, #A78BFA, #EE4266, #FF6B35)'
        }} 
      />
      
      <span className="font-display font-light text-6xl md:text-7xl tracking-tighter text-white relative z-10">
        m<span className="text-white/40">OS</span>
      </span>
    </div>
  </div>
);

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!import.meta.env.VITE_SUPABASE_URL || (!import.meta.env.VITE_SUPABASE_ANON_KEY && !import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY)) {
        throw new Error("Supabase credentials are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY) in your environment variables.");
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message?.includes('Failed to fetch') 
        ? 'Could not connect to the database. Please check your Supabase credentials in the environment variables.' 
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg overflow-hidden">
      {/* Left Pane - Branding */}
      <div className="flex-1 relative flex flex-col justify-between p-10 md:p-20 border-b md:border-b-0 md:border-r border-white/10 min-h-[50vh] md:min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        <FloatingOrbs />
        
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col mt-12 md:mt-0"
        >
          <h1 className="font-display font-light text-[100px] md:text-[160px] leading-none tracking-tightest text-white">
            m<span className="text-[#FF6B35] font-bold italic">OS</span>
          </h1>
          <p className="text-xl md:text-3xl font-display italic tracking-widest mt-4">
            <span className="text-white/70">memory </span>
            <span className="text-[#FF6B35] font-semibold">operating system</span>
          </p>
          
          <div className="w-16 h-1 bg-white/[0.1] rounded-full mt-12 mb-8" />
          
          <p className="text-white/40 text-sm md:text-base max-w-sm font-light leading-relaxed">
            A secure, categorized workspace for your fleeting thoughts, credentials, and important data.
          </p>
        </motion.div>
      </div>

      {/* Right Pane - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-20 relative bg-black/20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md relative z-30"
        >
          <div className="mb-12">
            <h2 className="font-display font-light text-3xl md:text-4xl tracking-tight text-white/95 mb-3">
              {isLogin ? 'Welcome back' : 'Initialize workspace'}
            </h2>
            <p className="text-white/40 text-sm tracking-wide font-light">
              {isLogin ? 'Authenticate to access your data' : 'Create your secure environment'}
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] p-8 md:p-10 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Subtle top highlight */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-light"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest-luxury text-white/40 font-bold mb-3 ml-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-white/30 group-focus-within:text-white/70 transition-colors" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/20 shadow-sm hover:border-white/30 rounded-[2rem] py-5 pl-12 pr-6 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500 font-light"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest-luxury text-white/40 font-bold mb-3 ml-2">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <KeyRound className="w-4 h-4 text-white/30 group-focus-within:text-white/70 transition-colors" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/20 shadow-sm hover:border-white/30 rounded-[2rem] py-5 pl-12 pr-6 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-500 font-light"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black rounded-[2rem] py-5 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-white/90 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed group mt-8 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Authenticate' : 'Initialize'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center relative z-10">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-white/30 hover:text-white/80 text-xs tracking-wide font-light transition-colors"
              >
                {isLogin ? "Don't have an account? Initialize one" : "Already have an account? Authenticate"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
