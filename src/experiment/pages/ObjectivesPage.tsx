import React from 'react';
import { Slide } from '../types';

export const ObjectivesPage: React.FC<{
  slide: Slide;
  onNext?: () => void;
}> = ({ slide }) => {
  const lead = slide.lead || 'By the end of this section, you will be able to:';

  let items = slide.items;
  if (!items || items.length === 0) {
    items = (slide.content || '')
      .split('\n')
      .map((line) => line.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(Boolean);
  }

  // Ensure content limit of dynamic goals
  const finalItems = items.slice(0, 4);

  // High-fidelity line icons matching screenshot 2 contextually
  const getGoalIcon = (text: string, index: number) => {
    const lower = text.toLowerCase();
    
    // 1. Sanitizer / chemical / ratio / bottle
    if (lower.includes('sanitizer') || lower.includes('dilut') || lower.includes('ratio') || lower.includes('mix') || lower.includes('solution')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5.5 h-5.5">
          <path d="M10 2h4M9 6h6v3l3 4v7c0 1.1-.9 2-2 2H8a2 2 0 0 1-2-2v-7l3-4V6Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 14h12" strokeLinecap="round" />
        </svg>
      );
    }
    // 2. High-touch / wipe / disinfect / sanitize / surfaces
    if (lower.includes('surface') || lower.includes('wipe') || lower.includes('sanitize') || lower.includes('clean') || lower.includes('disinfect')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5.5 h-5.5">
          <path d="M3 7a4 4 0 1 1 8 0v13H3V7Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 4h9M12 9h7M12 14h5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    // 3. Debris / dirt / dust / broom / trash
    if (lower.includes('debris') || lower.includes('dirt') || lower.includes('dust') || lower.includes('brush') || lower.includes('trash') || lower.includes('squeegee')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5.5 h-5.5">
          <path d="M12 2v14M5 16h14a2 2 0 0 1 2 2v2H3v-2a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }

    // Default checklist/goal fallback based on index
    if (index === 0) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5.5 h-5.5">
          <path d="M10 2h4M9 6h6v3l3 4v7c0 1.1-.9 2-2 2H8a2 2 0 0 1-2-2v-7l3-4V6Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (index === 1) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5.5 h-5.5">
          <path d="M3 7a4 4 0 1 1 8 0v13H3V7Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5.5 h-5.5">
        <path d="M12 2v14M5 16h14a2 2 0 0 1 2 2v2H3v-2a2 2 0 0 1 2-2Z" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <div className="space-y-4 text-left">
      {/* 1. Header Blue Card exactly matching Screenshot 2 */}
      <div className="bg-gradient-to-br from-[#1d3cb4] via-[#2462e3] to-[#4c84ff] rounded-3xl p-6 text-white relative overflow-hidden shadow-lg flex items-center justify-between min-h-[190px]">
        {/* Abstract vector wave background curves */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,rgba(255,255,255,0.12),transparent_50%)]" />

        <div className="space-y-2.5 z-10 max-w-[65%]">
          {/* Target / Goal Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold tracking-wide backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3.5 h-3.5 text-white inline shrink-0">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <span className="text-white">Lesson goals</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-white">
            {slide.title || 'What you will learn'}
          </h2>

          <p className="text-xs sm:text-sm font-semibold text-blue-100/90 leading-snug">
            {lead}
          </p>
        </div>

        {/* Dynamic target bulls-eye graphic with custom orange diagonal arrow overlay */}
        <div className="relative w-24 h-24 shrink-0 z-10 mr-1 select-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-white/95" stroke="currentColor" strokeWidth="2.5" fill="none">
            {/* Target rings */}
            <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
            <circle cx="50" cy="50" r="28" stroke="rgba(255,255,255,0.3)" strokeWidth="6" />
            <circle cx="50" cy="50" r="18" stroke="rgba(255,255,255,0.5)" strokeWidth="6" />
            <circle cx="50" cy="50" r="8" stroke="rgba(255,255,255,0.8)" strokeWidth="4" />
            <circle cx="50" cy="50" r="3" fill="#f59e0b" stroke="#f59e0b" />
            
            {/* Crisp Diagonal Gold Arrow */}
            <line x1="18" y1="82" x2="78" y2="22" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
            <polyline points="58 22 78 22 78 42" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* 2. Goals counter label */}
      <div className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 mt-3">
        {finalItems.length} GOALS
      </div>

      {/* 3. List of Beautiful Goals cards */}
      <div className="space-y-3">
        {finalItems.map((item, index) => {
          const paddedNum = String(index + 1).padStart(2, '0');
          return (
            <div
              key={index}
              className="relative bg-white rounded-2xl p-4 pl-6 border border-slate-100 shadow-xs flex items-center gap-4 min-h-[82px] overflow-hidden"
            >
              {/* Blue left edge stripe */}
              <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[#1d3cb4] rounded-l-2xl" />

              {/* Icon Container with blue layout */}
              <div className="w-12 h-12 rounded-2xl bg-[#eff6ff] text-[#1d3cb4] flex items-center justify-center shrink-0 shadow-2xs">
                {getGoalIcon(item, index)}
              </div>

              {/* Text Area */}
              <div className="flex-1 space-y-0.5 text-left pr-2">
                <div className="text-xs font-black text-[#1d3cb4] tracking-wider">
                  {paddedNum}
                </div>
                <h3 className="text-[12px] font-black text-slate-900 leading-tight">
                  {item}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
