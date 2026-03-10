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
    <div className="min-h-screen flex flex-col md:flex-row bg-bg overflow-hidden relative">
      {/* Global floating orbs behind both panes */}
      <FloatingOrbs />

      {/* Left Pane - Branding */}
      <div className="flex-1 relative flex flex-col justify-center p-10 md:p-20 min-h-[50vh] md:min-h-screen">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-30 flex flex-col"
        >
          {/* Brand Logo */}
          <h1 className="font-display font-light text-[100px] md:text-[160px] leading-none tracking-tightest text-white">
            m<span className="text-[#FF6B35] font-bold italic">OS</span>
          </h1>
          <p className="text-xl md:text-3xl font-display italic tracking-widest mt-4">
            <span className="text-white/70">memory </span>
            <span className="text-[#FF6B35] font-semibold">operating system</span>
          </p>
          
          <div className="w-16 h-1 bg-white/[0.15] rounded-full mt-12 mb-8" />
          
          <p className="text-white/50 text-sm md:text-base max-w-sm font-light leading-relaxed">
            A secure, categorized workspace for your fleeting thoughts, credentials, and important data.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mt-10">
            {['End-to-end encrypted', 'AI-powered', 'Real-time sync'].map((feature) => (
              <div
                key={feature}
                className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/40 text-[11px] font-semibold uppercase tracking-widest"
              >
                {feature}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Center Divider */}
      <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-white/[0.08] to-transparent relative z-30" />

      {/* Right Pane - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-20 relative z-30">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-12">
            <h2 className="font-display font-light text-3xl md:text-4xl tracking-tight text-white/95 mb-3">
              {isLogin ? 'Welcome back' : 'Initialize workspace'}
            </h2>
            <p className="text-white/40 text-sm tracking-wide font-light">
              {isLogin ? 'Authenticate to access your data' : 'Create your secure environment'}
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-8 md:p-10 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.6),_0_0_200px_rgba(0,0,0,0.3)] relative overflow-hidden">
            {/* Top highlight */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            {/* Side accent glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#FF6B35]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#A78BFA]/10 rounded-full blur-3xl pointer-events-none" />

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
                      className="w-full bg-white/5 border border-white/[0.12] shadow-sm hover:border-white/25 rounded-[2rem] py-5 pl-12 pr-6 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/[0.08] transition-all duration-500 font-light"
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
                      className="w-full bg-white/5 border border-white/[0.12] shadow-sm hover:border-white/25 rounded-[2rem] py-5 pl-12 pr-6 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/[0.08] transition-all duration-500 font-light"
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
