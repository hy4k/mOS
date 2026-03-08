import React from 'react';
import { motion } from 'motion/react';
import { Cpu } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col items-center justify-center"
    >
      <div className="relative">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 relative z-10"
        >
          <Cpu className="w-12 h-12 text-white" />
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-8 text-center"
      >
        <h1 className="font-display font-black text-4xl tracking-tighter text-white mb-2">
          m<span className="text-[#FF6B35]">OS</span>
        </h1>
        <p className="text-white/30 text-xs uppercase tracking-[0.4em] font-bold">
          Command Center
        </p>
      </motion.div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
          className="h-full bg-gradient-to-r from-[#FF6B35] to-[#EE4266]"
        />
      </div>
    </motion.div>
  );
};
