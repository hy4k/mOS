import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  imageClassName?: string;
  showGenerateButton?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className, imageClassName, showGenerateButton = false }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(() => localStorage.getItem('mOS_logo'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateLogo = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      // @ts-ignore - window.aistudio is injected by the platform
      if (window.aistudio) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
        }
      }

      // Create a new instance right before the call to get the latest key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            { text: 'A beautiful, modern, minimal logo for a secure digital vault and notes app called mOS. Dark theme, glowing indigo and purple accents, sleek, geometric, vector art style, clean background, no text.' }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          const url = `data:image/png;base64,${base64EncodeString}`;
          setLogoUrl(url);
          localStorage.setItem('mOS_logo', url);
          return;
        }
      }
      throw new Error('No image data returned from Gemini');
    } catch (err: any) {
      console.error('Failed to generate logo:', err);
      setError(err.message || 'Failed to generate logo');
      // If entity not found, might need to re-select key
      if (err.message?.includes('Requested entity was not found')) {
        // @ts-ignore
        if (window.aistudio) window.aistudio.openSelectKey();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (logoUrl) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
        <img src={logoUrl} alt="mOS Logo" className={cn("object-contain", imageClassName)} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className={cn("bg-white/5 rounded-[inherit] flex items-center justify-center border border-white/10 overflow-hidden", imageClassName)}>
        <span className="font-display font-bold text-white/50 tracking-widest text-[0.6em] sm:text-base">mOS</span>
      </div>
      
      {showGenerateButton && !logoUrl && (
        <button
          onClick={generateLogo}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-all text-xs font-bold uppercase tracking-widest"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isGenerating ? 'Generating...' : 'Generate Logo'}
        </button>
      )}
      {error && <p className="text-red-400 text-[10px] text-center max-w-xs">{error}</p>}
    </div>
  );
};
