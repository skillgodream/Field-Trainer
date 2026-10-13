import React, { useState } from 'react';
import { Slide } from '../types';
import { ArrowRight, Check, X } from 'lucide-react';

export const DecisionPage: React.FC<{
  slide: Slide;
  onChoiceSelect: (isCorrect: boolean, feedback: string) => void;
  feedback?: string | null;
  onNext?: () => void;
}> = ({ slide, onChoiceSelect, onNext }) => {
  // Extract options or provide authentic defaults matching Screenshot 1
  let options = (slide.opts || []).length > 0
    ? (slide.opts || []).map((o) => ({
        text: o.t,
        why: o.why,
        isCorrect: Boolean(o.ok),
      }))
    : (slide.choices || []).map((c) => ({
        text: c.text,
        why: c.feedback || c.why || '',
        isCorrect: Boolean(c.isCorrect),
      }));

  if (options.length === 0) {
    options = [
      {
        text: '1:5 concentrated ratio',
        why: 'Too concentrated. Excessive chemical strength damages sensitive surfaces and generates hazardous fumes.',
        isCorrect: false,
      },
      {
        text: '1:10 standard sanitizer ratio',
        why: 'Correct! Exactly 1:10 delivers optimal biocidal efficacy according to standard operating procedures.',
        isCorrect: true,
      },
      {
        text: '1:20 diluted ratio',
        why: 'Too diluted. Under-strength mixture fails to eliminate target microorganisms and breaks disinfection standards.',
        isCorrect: false,
      },
    ];
  }

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');

  const handleSelect = (index: number) => {
    // If already checked and solved, don't allow changing
    if (isChecked && isCorrect) return;

    setSelectedIndex(index);
    if (isChecked && !isCorrect) {
      // Learner picked a new option after a wrong attempt, reset checked state
      setIsChecked(false);
      setFeedbackText('');
    }
  };

  const handleAction = () => {
    if (selectedIndex === null) return;

    if (isChecked && isCorrect) {
      // Advance to next step
      if (onNext) {
        onNext();
      }
      return;
    }

    const opt = options[selectedIndex];
    if (!opt) return;

    setIsChecked(true);
    setFeedbackText(opt.why);

    if (opt.isCorrect) {
      setIsCorrect(true);
      onChoiceSelect(true, opt.why);
    } else {
      setIsCorrect(false);
      onChoiceSelect(false, opt.why);
    }
  };

  // Dedicated authentic image for disinfectant / dilution / sanitizer matching Screenshot 1
  const displayImage =
    slide.img ||
    'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="flex flex-col gap-4 select-none pb-2">
      {/* 1. TOP HERO CARD matching Screenshot 1 */}
      <div className="bg-gradient-to-r from-[#0a1e4a] via-[#0e2760] to-[#122b68] border border-blue-500/30 rounded-2xl sm:rounded-[22px] p-5 shadow-[0_8px_30px_rgba(10,30,74,0.35)] relative overflow-hidden flex items-center justify-between gap-3 text-left">
        {/* Subtle top specular glass highlight */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Left text block */}
        <div className="flex-1 min-w-0 pr-2">
          {/* Badge Pill: DECISION POINT */}
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#0c1d42]/90 border border-blue-400/40 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-blue-300 shadow-2xs mb-2.5">
            {slide.tag || 'DECISION POINT'}
          </div>

          {/* Heading: What should you Do? */}
          <h2 className="text-2xl sm:text-[28px] font-extrabold tracking-tight leading-tight text-white">
            {slide.title || 'What should you Do?'}
          </h2>
        </div>

        {/* Right Circular Speech Bubble with Question Mark matching Screenshot 1 */}
        <div className="w-14 h-14 rounded-full border border-blue-400/40 bg-blue-900/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.25)] text-sky-400">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 text-sky-400"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
      </div>

      {/* 2. IMAGE SLOT matching Screenshot 1 */}
      <div className="relative aspect-[16/10] w-full max-h-[220px] rounded-2xl overflow-hidden bg-[#091326] border border-blue-900/40 shrink-0 shadow-sm">
        <img
          src={displayImage}
          alt={slide.title || 'Disinfectant concentrate and measuring bottle setup'}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-2xl transition-opacity duration-300"
          onError={(e) => {
            // Fallback to high-res room cleaning asset
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80';
          }}
        />
      </div>

      {/* 3. OPTIONS LIST matching Screenshot 1 */}
      <div className="flex flex-col gap-3">
        {options.map((opt, j) => {
          const isSelected = selectedIndex === j;
          const isThisCorrect = opt.isCorrect;

          let cardStyle =
            'bg-[#091326] border border-blue-900/40 hover:border-blue-500/60';
          if (!isChecked) {
            if (isSelected) {
              cardStyle =
                'bg-[#0c1a36] border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.25)]';
            }
          } else {
            if (isThisCorrect) {
              cardStyle =
                'bg-emerald-950/40 border-2 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)]';
            } else if (isSelected && !isThisCorrect) {
              cardStyle =
                'bg-rose-950/40 border-2 border-rose-500 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.25)]';
            } else {
              cardStyle = 'bg-[#091326]/60 border border-blue-950/40 opacity-50';
            }
          }

          return (
            <div
              key={j}
              onClick={() => handleSelect(j)}
              className={`rounded-2xl p-4 transition-all duration-200 flex items-center gap-3.5 cursor-pointer ${cardStyle}`}
            >
              {/* Radio circle indicator on left */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  isChecked
                    ? isThisCorrect
                      ? 'border-emerald-400 bg-emerald-500/20'
                      : isSelected
                      ? 'border-rose-400 bg-rose-500/20'
                      : 'border-slate-600'
                    : isSelected
                    ? 'border-sky-400 bg-sky-500/20'
                    : 'border-slate-600'
                }`}
              >
                {isChecked ? (
                  isThisCorrect ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  ) : isSelected ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  ) : null
                ) : isSelected ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                ) : null}
              </div>

              {/* Number Badge with rounded square styling (1, 2, 3) */}
              <div className="w-7 h-7 rounded-lg bg-[#0e234e] border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                <span>{j + 1}</span>
              </div>

              {/* Option Text */}
              <span className="text-sm sm:text-base font-semibold text-white/95 flex-1 text-left">
                {opt.text}
              </span>

              {/* Evaluated Status Icon on right */}
              {isChecked && (
                <div className="shrink-0">
                  {isThisCorrect ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-400 text-rose-300 flex items-center justify-center">
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. FEEDBACK / RATIONALE CARD */}
      {isChecked && feedbackText && (
        <div
          className={`p-4 rounded-2xl border space-y-1 animate-in fade-in duration-200 ${
            isCorrect
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div
            className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
              isCorrect ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <span>{isCorrect ? '✓' : '✕'}</span>
            <span>{isCorrect ? 'Compliant Rationale' : 'SOP Hazard Alert'}</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed opacity-95">
            {feedbackText}
          </p>
        </div>
      )}

      {/* 5. CHECK ANSWER / CONTINUE ACTION BUTTON matching Screenshot 1 */}
      <button
        onClick={handleAction}
        disabled={selectedIndex === null}
        className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          isChecked && isCorrect
            ? 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-[0_4px_25px_rgba(16,185,129,0.4)]'
            : 'bg-gradient-to-r from-[#0066fe] to-[#1b8aff] shadow-[0_4px_25px_rgba(0,102,254,0.4)] hover:brightness-110 active:scale-[0.99]'
        }`}
      >
        <span>{isChecked && isCorrect ? 'Continue' : 'Check answer'}</span>
        <ArrowRight className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
};
