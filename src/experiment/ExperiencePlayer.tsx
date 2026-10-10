import React, { useState, useEffect } from 'react';
import { SlidePlan } from './types';
import { Renderer } from './Renderer';
import { Text, AccentProvider, getAccentForSlideType } from './tokens';

export function ExperiencePlayer({
  plan,
  onClose,
  onComplete,
}: {
  plan: SlidePlan;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [decisionSolved, setDecisionSolved] = useState<boolean>(false);

  const slide = plan.slides[currentIndex];
  const isDecision = slide?.type === 'DECISION';
  const isLastSlide = currentIndex === plan.slides.length - 1;

  // Reset decision state when slide changes
  useEffect(() => {
    setFeedback(null);
    setDecisionSolved(false);
  }, [currentIndex]);

  if (!slide) return <div>Error: slide not found</div>;

  const handleChoice = (isCorrect: boolean, feedbackText: string) => {
    setFeedback(feedbackText);
    if (isCorrect) {
      setDecisionSolved(true);
    }
  };

  const handleNext = () => {
    if (isLastSlide) {
      if (onComplete) {
        onComplete();
      } else {
        onClose();
      }
      return;
    }
    setCurrentIndex((prev) => Math.min(plan.slides.length - 1, prev + 1));
  };

  const handleBack = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const isNextDisabled = isDecision && !decisionSolved;
  const accent = getAccentForSlideType(slide.type);

  // Accent mapping for footer Next button and active dots
  const buttonColors: Record<string, string> = {
    indigo: 'bg-[#3B4FE0] hover:bg-[#2C3EB2] disabled:bg-[#3B4FE0]/40',
    teal: 'bg-[#0E8A9A] hover:bg-[#0A6D7A] disabled:bg-[#0E8A9A]/40',
    plum: 'bg-[#6B2FB0] hover:bg-[#53208E] disabled:bg-[#6B2FB0]/40',
    ember: 'bg-[#D9541E] hover:bg-[#B34012] disabled:bg-[#D9541E]/40',
  };

  const activeDotColors: Record<string, string> = {
    indigo: 'bg-[#3B4FE0]',
    teal: 'bg-[#0E8A9A]',
    plum: 'bg-[#6B2FB0]',
    ember: 'bg-[#D9541E]',
  };

  const resolvedButtonColor = buttonColors[accent] || buttonColors.indigo;
  const resolvedDotColor = activeDotColors[accent] || activeDotColors.indigo;

  const isWelcome = slide?.type === 'WELCOME';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070A14] select-none p-0 sm:p-4">
      <div className="w-full max-w-[420px] h-full sm:h-[780px] sm:rounded-[28px] bg-[#F6F7FB] flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(15,27,61,0.25)] relative">
        {/* 1. TOP BAR CHROME (strictly 44px, Exit on left, counter on right) - Hidden on Welcome */}
        {!isWelcome && (
          <div className="h-11 flex items-center justify-between px-4 bg-white border-b border-[#E3E8F4] shrink-0 select-none">
            <button
              onClick={onClose}
              className="h-11 flex items-center justify-center cursor-pointer hover:opacity-80 active:scale-95 border-0 bg-transparent text-[#3B4FE0]"
            >
              <Text styleName="button" className="text-[#3B4FE0]">Exit</Text>
            </button>

            <div className="flex items-center">
              <Text styleName="counter" className="text-[#6B7691]">
                {currentIndex + 1} / {plan.slides.length}
              </Text>
            </div>
          </div>
        )}

        {/* 2. SLIDE BODY CONTAINER - Full screen padding-0 for welcome screen */}
        <div className={`flex-1 overflow-y-auto animate-in fade-in duration-200 ${isWelcome ? 'p-0' : 'px-4 py-4'}`}>
          <AccentProvider value={accent}>
            <Renderer
              slide={slide}
              onChoiceSelect={handleChoice}
              feedback={feedback}
              onNext={handleNext}
              slideIndex={currentIndex}
              totalSlides={plan.slides.length}
              onClose={onClose}
            />
          </AccentProvider>
        </div>

        {/* 3. FIXED CHROME FOOTER - Hidden on Welcome */}
        {!isWelcome && (
          <div className="p-4 bg-white border-t border-[#E3E8F4] flex items-center justify-between gap-2 shrink-0 select-none">
            {currentIndex > 0 ? (
              <button
                onClick={handleBack}
                className="min-h-[44px] px-4 py-2 rounded-[999px] border border-[#E3E8F4] text-[#0F1B3D] font-bold cursor-pointer hover:bg-[#F6F7FB] active:scale-95 transition-all bg-white shrink-0"
              >
                <Text styleName="button">Back</Text>
              </button>
            ) : (
              <div className="w-[64px] shrink-0" /> // Spacer to balance layout
            )}

            {/* Progress dots */}
            <div className="flex-1 min-w-0 overflow-x-auto flex items-center justify-center gap-1.5 py-1 px-1 no-scrollbar">
              {plan.slides.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 ${
                    idx === currentIndex ? `w-4 ${resolvedDotColor}` : 'bg-[#E3E8F4]'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={isNextDisabled}
              className={`min-h-[44px] px-5 py-2 rounded-[999px] text-white font-bold cursor-pointer transition-all duration-200 active:scale-95 disabled:cursor-not-allowed ${resolvedButtonColor} border-0 shrink-0`}
            >
              <Text styleName="button">{isLastSlide ? 'Complete' : 'Next'}</Text>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
