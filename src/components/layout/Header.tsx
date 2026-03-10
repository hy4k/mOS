import React from 'react';
import { motion } from 'motion/react';
import { Search, LayoutGrid, List, Settings, Cloud, CloudOff, RefreshCw, Calculator, X } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { CATEGORIES } from '../../lib/constants';
import { cn } from '../../lib/utils';

export const Header: React.FC = () => {
  const { activeCategory, viewMode, setViewMode, setSearchOpen, setSettingsOpen, syncStatus } = useAppStore();
  const [isCalculatorOpen, setIsCalculatorOpen] = React.useState(false);
  const [calcDisplay, setCalcDisplay] = React.useState('0');
  const [calcMemory, setCalcMemory] = React.useState<number | null>(null);
  const [calcOperator, setCalcOperator] = React.useState<string | null>(null);
  const [calcNewNumber, setCalcNewNumber] = React.useState(true);

  const handleCalcInput = (btn: string) => {
    if (/[0-9]/.test(btn)) {
      if (calcNewNumber) {
        setCalcDisplay(btn);
        setCalcNewNumber(false);
      } else {
        setCalcDisplay(calcDisplay === '0' ? btn : calcDisplay + btn);
      }
    } else if (btn === 'C') {
      setCalcDisplay('0');
      setCalcMemory(null);
      setCalcOperator(null);
      setCalcNewNumber(true);
    } else if (['+', '-', '×', '÷'].includes(btn)) {
      if (calcOperator && !calcNewNumber) {
        handleCalcInput('=');
      }
      setCalcMemory(parseFloat(calcDisplay));
      setCalcOperator(btn);
      setCalcNewNumber(true);
    } else if (btn === '=') {
      if (calcOperator && calcMemory !== null) {
        const current = parseFloat(calcDisplay);
        let result = 0;
        switch (calcOperator) {
          case '+': result = calcMemory + current; break;
          case '-': result = calcMemory - current; break;
          case '×': result = calcMemory * current; break;
          case '÷': result = calcMemory / current; break;
        }
        setCalcDisplay(result.toString());
        setCalcMemory(null);
        setCalcOperator(null);
        setCalcNewNumber(true);
      }
    }
  };

  const category = CATEGORIES[activeCategory];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-20 flex items-center justify-between px-5 md:px-8">
      {/* Glassmorphic background bar */}
      <div className="absolute inset-x-3 inset-y-2 rounded-2xl bg-white/[0.025] backdrop-blur-3xl border border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.03)]" />

      {/* Left - Brand */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="flex flex-col">
          <h1 className="font-display font-light text-3xl leading-none tracking-tightest">
            m<span className="text-[#FF6B35] font-bold italic">OS</span>
          </h1>
          <p className="text-[9px] font-display italic tracking-widest mt-0.5">
            <span className="text-white/50">memory </span>
            <span className="text-[#FF6B35]/80 font-semibold">operating system</span>
          </p>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-1.5 relative z-10">
        {/* Sync Status */}
        <div className="flex items-center gap-1.5 mr-1 md:mr-3 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05]" title={syncStatus}>
          {syncStatus === 'Syncing...' && <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />}
          {syncStatus === 'Up to date' && <Cloud className="w-3 h-3 text-emerald-400" />}
          {syncStatus === 'Offline' && <CloudOff className="w-3 h-3 text-red-400" />}
          <span className="hidden md:inline text-[9px] font-bold tracking-widest text-white/40 uppercase">
            {syncStatus}
          </span>
        </div>

        {/* Action buttons - boxed premium style */}
        <button
          onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
          className={cn(
            "w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-300 group",
            isCalculatorOpen 
              ? "bg-white/10 border-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.05)]" 
              : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12] text-white/50 hover:text-white/90"
          )}
        >
          <Calculator className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={() => setSearchOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-300 text-white/50 hover:text-white/90 group"
        >
          <Search className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={() => setViewMode(viewMode === 'cards' ? 'compact' : 'cards')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-300 text-white/50 hover:text-white/90 group"
        >
          {viewMode === 'cards' ? (
            <List className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          ) : (
            <LayoutGrid className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          )}
        </button>
        <div className="w-px h-5 bg-white/[0.08] mx-0.5" />
        <button 
          onClick={() => setSettingsOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-300 text-white/50 hover:text-white/90 group"
        >
          <Settings className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
        </button>
      </div>

      {isCalculatorOpen && (
        <motion.div 
          drag
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute top-20 right-6 z-50 bg-bg/95 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl w-[260px] cursor-move"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-lg text-white/90">Calculator</h3>
            <button onClick={() => setIsCalculatorOpen(false)} className="text-white/40 hover:text-white transition-colors cursor-pointer p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-4 bg-white/5 rounded-xl p-3 text-right text-2xl font-mono text-white mb-2 overflow-hidden truncate border border-white/5">
              {calcDisplay}
            </div>
            {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', 'C', '0', '=', '+'].map(btn => (
              <button 
                key={btn} 
                onClick={() => handleCalcInput(btn)}
                className={cn(
                  "rounded-xl p-3 text-lg font-mono transition-colors active:scale-95 border",
                  ['÷', '×', '-', '+', '='].includes(btn) 
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30" 
                    : btn === 'C' 
                      ? "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
                      : "bg-white/5 text-white border-white/5 hover:bg-white/10"
                )}
              >
                {btn}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </header>
  );
};
