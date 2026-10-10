import React, { useState } from 'react';
import { Slide } from '../types';
import { Text, Pill, Panel, ImageSlot, getChoiceContainerClass, getChoiceBadgeClass, getCorrectnessBadgeClass, SopHeader } from '../tokens';

export const DecisionPage: React.FC<{
  slide: Slide;
  onChoiceSelect: (isCorrect: boolean, feedback: string) => void;
  feedback?: string | null;
  onNext?: () => void;
}> = ({ slide, onChoiceSelect, feedback }) => {
  const [selectedIndices, setSelectedIndices] = useState<Record<number, boolean>>({});
  const [feedbackText, setFeedbackText] = useState<string>(
    feedback || 'Select an option to evaluate your judgment according to SOP.'
  );
  const [isSolved, setIsSolved] = useState<boolean>(false);

  const options = (slide.opts || []).length > 0
    ? (slide.opts || []).map((o) => ({
        text: o.t,
        why: o.why,
        isCorrect: Boolean(o.ok),
      }))
    : (slide.choices || []).map((c) => ({
        text: c.text,
        why: c.feedback || c.why || '',
        isCorrect: c.isCorrect,
      }));

  const handlePick = (index: number) => {
    if (isSolved) return;

    const opt = options[index];
    if (!opt) return;

    setSelectedIndices((prev) => ({ ...prev, [index]: true }));
    setFeedbackText(opt.why);

    if (opt.isCorrect) {
      setIsSolved(true);
      onChoiceSelect(true, opt.why);
    } else {
      onChoiceSelect(false, opt.why);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Universal SOP Header */}
      <SopHeader tag={slide.tag || 'Decision point'} title={slide.title || 'What should you do?'} />

      {/* 3. Visual */}
      <ImageSlot src={slide.img} alt={slide.title} textContext={slide.title} />

      {/* 4. Content block: Options & Rationale box */}
      <div className="flex flex-col gap-3">
        {options.map((opt, j) => {
          const wasClicked = selectedIndices[j];
          const optionState = wasClicked 
            ? (opt.isCorrect ? 'correct' : 'wrong') 
            : 'default';

          const containerClass = getChoiceContainerClass(optionState);
          const badgeClass = getChoiceBadgeClass(optionState);

          return (
            <button
              key={j}
              disabled={isSolved && !wasClicked}
              onClick={() => handlePick(j)}
              className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer disabled:cursor-not-allowed ${containerClass}`}
            >
              <div className="flex items-center gap-3">
                {/* Number Badge with Style styleName="counter" */}
                <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${badgeClass}`}>
                  <Text styleName="counter" className="text-inherit">
                    {String(j + 1)}
                  </Text>
                </span>

                <Text styleName="list-item" className="text-inherit">
                  {opt.text}
                </Text>
              </div>

              {wasClicked && (
                <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                  getCorrectnessBadgeClass(opt.isCorrect)
                }`}>
                  <Text styleName="counter" className="text-inherit">
                    {opt.isCorrect ? '✓' : '✕'}
                  </Text>
                </span>
              )}
            </button>
          );
        })}

        {/* Feedback / Rationale Panel */}
        {feedbackText && (
          <Panel
            type={
              isSolved 
                ? 'do' 
                : Object.keys(selectedIndices).length > 0 
                ? 'dont' 
                : 'default'
            }
            className="flex flex-col gap-2"
          >
            <Text styleName="panel-heading">
              {isSolved ? 'Compliant rationale' : Object.keys(selectedIndices).length > 0 ? 'SOP hazard' : 'Guidance'}
            </Text>
            <Text styleName="body">{feedbackText}</Text>
          </Panel>
        )}
      </div>
    </div>
  );
};
