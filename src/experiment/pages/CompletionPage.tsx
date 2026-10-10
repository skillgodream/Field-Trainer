import React from 'react';
import { Slide } from '../types';
import { Text, Panel } from '../tokens';

export const CompletionPage: React.FC<{
  slide: Slide;
  onNext: () => void;
}> = ({ slide }) => {
  const nextTitle = slide.next || 'Next mode: guide me';
  const nextSubtitle = slide.nb || 'Practise the steps with live coach guidance beside you.';

  return (
    <div className="done flex flex-col items-center justify-center text-center h-full p-4 sm:p-6 select-none my-auto">
      {/* 1. Golden Celebration Icon - Thick & Highly Visible */}
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        className="conf mb-4 animate-in zoom-in duration-500"
      >
        {/* Premium translucent backing circle for massive contrast */}
        <circle cx="12" cy="12" r="10" fill="#FEF3C7" stroke="none" />
        
        {/* High contrast outline */}
        <circle cx="12" cy="12" r="10" stroke="#F0A030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Extra thick checkmark line */}
        <polyline 
          points="8 12 11 15 16 9" 
          stroke="#F0A030" 
          strokeWidth="3.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>

      {/* 2. Slide Title */}
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2">
        {slide.title || 'Theory mastery achieved'}
      </h2>

      {/* 3. Lead description */}
      <p className="text-sm font-semibold text-slate-500 max-w-sm leading-relaxed mb-6">
        {slide.content || "You've reviewed the operational logic. Ready for interactive floor practice?"}
      </p>

      {/* 4. Recommended Next Action Panel */}
      <Panel type="default" className="flex flex-col gap-2 w-full max-w-sm text-left p-5 border border-slate-100 rounded-2xl bg-white shadow-xs">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
          <Text styleName="panel-heading" className="text-indigo-950 font-black">
            {nextTitle}
          </Text>
        </div>
        <Text styleName="body" className="text-slate-500 font-semibold pl-4.5">
          {nextSubtitle}
        </Text>
      </Panel>
    </div>
  );
};
