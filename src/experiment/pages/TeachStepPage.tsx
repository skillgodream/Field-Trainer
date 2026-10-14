import React from 'react';
import { ShieldCheck, Lightbulb, ArrowRight, CheckCircle2, Sparkles, AlertTriangle } from 'lucide-react';
import { Slide } from '../types';
import { ImageSlot } from '../tokens';

export const TeachStepPage: React.FC<{
  slide: Slide;
  onNext?: () => void;
}> = ({ slide }) => {
  const stepLabel = slide.step || slide.tag || 'Step 1 of 1';

  // 1. Extract raw items from slide.items or slide.content
  let rawItems: string[] = [];
  if (slide.items && slide.items.length > 0) {
    rawItems = [...slide.items];
  } else if (slide.content) {
    rawItems = slide.content
      .split('\n')
      .map((l) => l.replace(/^[\*\-•\d\.]\s*/, '').trim())
      .filter(Boolean);
  }

  // 2. Extract or categorize fields for the 3 distinct cards
  let actionText = '';
  let whyText = slide.why || '';
  let tipText = slide.nb || '';
  const extraItems: string[] = [];

  rawItems.forEach((item, idx) => {
    const itemLower = item.toLowerCase();
    if (
      itemLower.startsWith('why it matters:') ||
      itemLower.startsWith('why:') ||
      itemLower.startsWith('rationale:') ||
      itemLower.startsWith('reason:')
    ) {
      whyText = item.replace(/^(why it matters:|why:|rationale:|reason:)\s*/i, '');
    } else if (
      itemLower.startsWith('tip:') ||
      itemLower.startsWith('pro tip:') ||
      itemLower.startsWith('coach tip:') ||
      itemLower.startsWith('watch-out:') ||
      itemLower.startsWith('field tip:') ||
      itemLower.startsWith('note:')
    ) {
      tipText = item.replace(/^(tip:|pro tip:|coach tip:|watch-out:|field tip:|note:)\s*/i, '');
    } else if (idx === 0 && !actionText) {
      actionText = item;
    } else if (idx === 1 && !whyText) {
      whyText = item;
    } else if (idx === 2 && !tipText) {
      tipText = item;
    } else {
      extraItems.push(item);
    }
  });

  // Fallback for action text
  if (!actionText) {
    actionText = slide.lead || slide.title || 'Perform primary standard operating procedure step.';
  }

  return (
    <div className="flex flex-col gap-5 select-none relative">
      {/* Background Subtle Glow Halos */}
      <div className="aria-hidden:true pointer-events-none absolute -top-10 -left-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="aria-hidden:true pointer-events-none absolute top-1/2 -right-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />

      {/* Modern Frosted Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col gap-2">
        <div className="flex items-center justify-between">
          {/* Step Pill Accent */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-[11px] font-black uppercase tracking-wider shadow-inner">
            <Sparkles size={12} className="text-indigo-400" />
            <span>{stepLabel}</span>
          </div>
          <span className="text-[11px] font-medium text-slate-400">SOP Guidance</span>
        </div>

        {/* Primary Step Title */}
        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug drop-shadow-sm mt-1">
          {slide.title}
        </h2>
      </div>

      {/* Image / Visual Media Slot if available */}
      {slide.img && (
        <div className="rounded-2xl border border-white/10 overflow-hidden shadow-xl backdrop-blur-md bg-slate-900/50 p-1">
          <ImageSlot src={slide.img} alt={slide.title} textContext={slide.title} />
        </div>
      )}

      {/* Main Content Layout Architecture */}
      <div className="flex flex-col gap-4">
        {/* HERO CARD: PRIMARY TASK DIRECTIVE */}
        <div className="group relative p-5 rounded-2xl bg-gradient-to-br from-blue-950/60 via-slate-900/80 to-slate-950/90 backdrop-blur-2xl border border-blue-500/35 shadow-[0_0_25px_rgba(59,130,246,0.15)] hover:border-blue-400/50 transition-all duration-300">
          {/* Subtle Glass Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

          <div className="flex items-start gap-3.5 relative z-10">
            {/* Capsule Icon Anchor */}
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.3)] mt-0.5">
              <CheckCircle2 size={20} className="text-blue-300" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200 bg-blue-900/80 px-2.5 py-0.5 rounded-full border border-blue-400/30 backdrop-blur-md shadow-sm">
                  PRIMARY TASK DIRECTIVE
                </span>
                <span className="text-[11px] font-bold text-blue-300/90">Mandatory Action</span>
              </div>

              {/* Striking Bold Primary Action */}
              <p className="text-base sm:text-lg font-extrabold text-white leading-snug tracking-tight">
                {actionText}
              </p>
            </div>
          </div>
        </div>

        {/* ASYMMETRIC SUB-PANELS: RATIONALE & FIELD WATCH-OUT */}
        {(whyText || tipText) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* SUB-PANEL 1: OPERATIONAL RATIONALE (WHY IT MATTERS) */}
            {whyText && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/50 via-slate-900/80 to-purple-950/30 backdrop-blur-xl border border-purple-500/30 shadow-[0_4px_20px_rgba(147,51,234,0.12)] flex flex-col gap-2.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center shrink-0 shadow-sm">
                      <ShieldCheck size={16} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-200 bg-purple-900/70 px-2 py-0.5 rounded-md border border-purple-400/30">
                      WHY IT MATTERS
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-300/80">Risk Prevention</span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-purple-100/90 leading-relaxed pl-0.5">
                  {whyText}
                </p>
              </div>
            )}

            {/* SUB-PANEL 2: FIELD WATCH-OUT & ON-THE-FLOOR PRACTICE */}
            {tipText && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900/80 to-emerald-950/30 backdrop-blur-xl border border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.12)] flex flex-col gap-2.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-sm">
                      <Lightbulb size={16} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 bg-emerald-900/70 px-2 py-0.5 rounded-md border border-emerald-400/30">
                      FIELD WATCH-OUT
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-300/80">Practical Tip</span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-emerald-100/90 leading-relaxed pl-0.5">
                  {tipText}
                </p>
              </div>
            )}
          </div>
        )}

        {/* EXTRA DECISION / CONDITION ITEMS */}
        {extraItems.map((item, index) => {
          if (item.includes('→')) {
            const [situation, action] = item.split('→').map((s) => s.trim());
            return (
              <div
                key={index}
                className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 shadow-[0_4px_20px_rgba(6,182,212,0.1)] flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 flex items-center justify-center shrink-0">
                    <AlertTriangle size={14} />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 text-[9px] font-black uppercase tracking-wider">
                    DECISION TRIGGER
                  </span>
                  <span className="text-xs font-bold text-slate-100">{situation}</span>
                </div>
                {action && (
                  <div className="flex items-center gap-2 pt-1.5 border-t border-cyan-500/20 text-xs font-semibold text-emerald-300 pl-8">
                    <ArrowRight size={14} className="shrink-0 text-emerald-400" />
                    <span>Directive: {action}</span>
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};


