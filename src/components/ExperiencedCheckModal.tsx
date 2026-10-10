import React, { useState } from 'react';
import { X, Check, AlertTriangle, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { EXPERIENCED_CHECK_QUESTIONS } from '../data/lessonsData';
import { sounds } from '../utils/audio';

interface ExperiencedCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPass: () => void;
  onFail: () => void;
  onAskTrainer: () => void;
}

export default function ExperiencedCheckModal({
  isOpen,
  onClose,
  onPass,
  onFail,
  onAskTrainer,
}: ExperiencedCheckModalProps) {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showSafetyCard, setShowSafetyCard] = useState(false);

  if (!isOpen) return null;

  const currentQ = EXPERIENCED_CHECK_QUESTIONS[currentQIndex];
  const totalQuestions = EXPERIENCED_CHECK_QUESTIONS.length;

  const handleSelectOption = (optionId: string, isCorrect: boolean) => {
    if (selectedOptionId) return;
    setSelectedOptionId(optionId);

    if (isCorrect) {
      sounds.playCorrect();
      setCorrectCount((prev) => prev + 1);
    } else {
      sounds.playWrong();
    }
  };

  const handleNext = () => {
    sounds.playTap();
    if (currentQIndex < totalQuestions - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOptionId(null);
    } else {
      setIsFinished(true);
      const score = Math.round(((correctCount + (selectedOptionId && currentQ.options.find(o => o.id === selectedOptionId)?.isCorrect ? 1 : 0)) / totalQuestions) * 100);
      if (score >= 75) {
        setShowSafetyCard(true);
      }
    }
  };

  const handleReset = () => {
    setCurrentQIndex(0);
    setSelectedOptionId(null);
    setCorrectCount(0);
    setIsFinished(false);
    setShowSafetyCard(false);
  };

  // Assessment Complete Result Screen
  if (isFinished) {
    const finalScore = Math.round((correctCount / totalQuestions) * 100);
    const passed = finalScore >= 75;

    return (
      <div className="fixed inset-0 z-50 bg-[#0E1116]/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-8 duration-200">
          <div className="flex justify-between items-center border-b border-[#E6E8EC] pb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#2F6FED]">
              Experienced Check · {finalScore}%
            </span>
            <button
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-[#F7F7F5] flex items-center justify-center text-[#0E1116]"
            >
              <X size={16} />
            </button>
          </div>

          {passed ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-[#DDF3E6] text-[#1FA55E] flex items-center justify-center mx-auto shadow-md">
                <Check size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0E1116]">Check Passed ({correctCount}/4 Correct)</h3>
                <p className="text-xs text-[#3D4652] mt-1 font-semibold">
                  You demonstrated solid operational grasp. You can skip the intro cards!
                </p>
              </div>

              {/* Mandatory Safety Card Confirmation */}
              <div className="p-4 bg-[#FBE0EA]/60 border-2 border-[#E5484D]/30 rounded-2xl text-left space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#E5484D]">
                  <ShieldCheck size={18} />
                  <span>Mandatory Floor Safety Rule</span>
                </div>
                <p className="text-sm font-bold text-[#991B1B]">
                  "Don't guess. Stop. Check. Act correctly."
                </p>
                <p className="text-[11px] text-[#66726B] font-semibold">
                  Never grab stock before scanning the bin barcode. Always report shelf shortages immediately.
                </p>
              </div>

              <button
                onClick={() => {
                  sounds.playTap();
                  handleReset();
                  onPass();
                }}
                className="w-full h-14 rounded-full bg-[#0E1116] hover:bg-black text-white font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-all shadow-lg"
              >
                Skip Cards → Continue to Show Me <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-[#FFE6D2] text-[#F27A1A] flex items-center justify-center mx-auto shadow-md">
                <AlertTriangle size={30} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0E1116]">Review Recommended ({correctCount}/4)</h3>
                <p className="text-xs text-[#3D4652] mt-1 font-semibold leading-relaxed">
                  A quick walk through the presentation cards in <b>Know It</b> will refresh the exact procedure for this warehouse.
                </p>
              </div>

              <button
                onClick={() => {
                  sounds.playTap();
                  handleReset();
                  onFail();
                }}
                className="w-full h-14 rounded-full bg-[#0E1116] hover:bg-black text-white font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-all shadow-lg"
              >
                Continue to Know It <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active Question Display
  return (
    <div className="fixed inset-0 z-50 bg-[#0E1116]/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-8 duration-200">
        {/* Top Header */}
        <div className="flex justify-between items-center border-b border-[#E6E8EC] pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#2F6FED]">
              Experienced Check · Question {currentQIndex + 1} of {totalQuestions}
            </span>
            <div className="text-xs font-bold text-[#0E1116]">Score ≥ 75% skips intro cards</div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#F7F7F5] flex items-center justify-center text-[#0E1116]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Question Prompt */}
        <div className="p-3.5 bg-[#F7F7F5] rounded-2xl border border-[#E6E8EC]">
          <p className="text-sm font-bold text-[#0E1116] leading-snug">{currentQ.question}</p>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {currentQ.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const revealed = selectedOptionId !== null;

            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt.id, opt.isCorrect)}
                disabled={revealed}
                className={`w-full p-3.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                  isSelected && opt.isCorrect
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : isSelected && !opt.isCorrect
                    ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                    : revealed && opt.isCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-white hover:bg-slate-50 border-[#E6E8EC] text-[#0E1116]'
                }`}
              >
                <span>{opt.text}</span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 ml-2">
                    {opt.isCorrect ? <Check size={14} /> : <X size={14} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Rationale if revealed */}
        {selectedOptionId && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-[#3D4652] font-semibold animate-in fade-in">
            {currentQ.explanation}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              sounds.playTap();
              onAskTrainer();
            }}
            className="text-xs font-bold text-[#66726B] hover:text-[#0E1116] flex items-center gap-1.5"
          >
            <UserCheck size={15} className="text-[#1FA55E]" />
            Ask trainer
          </button>

          <button
            onClick={handleNext}
            disabled={!selectedOptionId}
            className={`h-12 px-6 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all ${
              selectedOptionId
                ? 'bg-[#0E1116] text-white shadow-md active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {currentQIndex === totalQuestions - 1 ? 'See Check Results' : 'Next Question'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
