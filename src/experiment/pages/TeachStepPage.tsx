import React from 'react';
import { ShieldCheck, Lightbulb, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Slide } from '../types';
import { ImageSlot, SopHeader } from '../tokens';

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
    <div className="flex flex-col gap-4 select-none">
      {/* Universal SOP Header */}
      <SopHeader tag={stepLabel} title={slide.title} />

      {/* Visual Slot */}
      <ImageSlot src={slide.img} alt={slide.title} textContext={slide.title} />

      {/* Differentiated Operational Cards Container */}
      <div className="flex flex-col gap-3">
        {/* CARD 1: PRIMARY OPERATIONAL ACTION DIRECTIVE */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d2260] via-[#10348a] to-[#132d75] border border-blue-500/40 text-white shadow-lg relative overflow-hidden flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#0e234e] border border-blue-400/50 text-blue-300 font-black text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <CheckCircle2 size={18} className="text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 bg-blue-900/80 px-2 py-0.5 rounded border border-blue-400/40">
                PRIMARY OPERATIONAL DIRECTIVE
              </span>
              <span className="text-[10px] font-bold text-blue-300">Mandatory Action</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-white leading-relaxed mt-1">
              {actionText}
            </p>
          </div>
        </div>

        {/* CARD 2: OPERATIONAL RATIONALE (WHY THIS MATTERS) */}
        {whyText && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1c1136] via-[#160c2d] to-[#120a26] border border-[#6b3eba]/50 text-purple-100 shadow-lg relative overflow-hidden flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#3B1E6D] text-purple-300 flex items-center justify-center shrink-0 mt-0.5 shadow-sm border border-purple-400/40">
              <ShieldCheck size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-200 bg-purple-900/80 px-2 py-0.5 rounded border border-purple-400/40">
                  OPERATIONAL RATIONALE · WHY THIS MATTERS
                </span>
                <span className="text-[10px] font-bold text-purple-300">Risk Prevention</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-purple-100 leading-relaxed mt-1">
                {whyText}
              </p>
            </div>
          </div>
        )}

        {/* CARD 3: ON-THE-FLOOR PRACTICE & FIELD WATCH-OUT */}
        {tipText && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0c2a1e] via-[#092218] to-[#061811] border border-[#1f8760]/50 text-emerald-100 shadow-lg relative overflow-hidden flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#144A36] text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 shadow-sm border border-emerald-400/40">
              <Lightbulb size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-400/40">
                  ON-THE-FLOOR PRACTICE · FIELD WATCH-OUT
                </span>
                <span className="text-[10px] font-bold text-emerald-300">Practical Application</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-emerald-100 leading-relaxed mt-1">
                {tipText}
              </p>
            </div>
          </div>
        )}

        {/* Extra Decision/Condition Items if present */}
        {extraItems.map((item, index) => {
          if (item.includes('→')) {
            const [situation, action] = item.split('→').map((s) => s.trim());
            return (
              <div
                key={index}
                className="p-4 rounded-2xl bg-gradient-to-r from-[#0a1e4a] to-[#122b68] border border-blue-500/40 text-slate-100 shadow-md flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[9px] font-black uppercase tracking-wider">
                    DECISION TRIGGER
                  </span>
                  <span className="text-xs font-bold text-blue-100">{situation}</span>
                </div>
                {action && (
                  <div className="flex items-center gap-2 pt-1 border-t border-blue-500/20 text-xs font-semibold text-emerald-300">
                    <ArrowRight size={14} className="shrink-0 text-emerald-400" />
                    <span>Action: {action}</span>
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

