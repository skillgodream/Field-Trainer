import React, { useState, useEffect } from 'react';
import { Check, X, Sparkles, BookOpen } from 'lucide-react';
import { SIMULATION_STEPS, SIMULATION_STEPS_B } from '../data/lessonsData';
import { SimulatorStep, Lesson, SourceMeta } from '../types';
import AskTrainerModal from './AskTrainerModal';
import MicroLessonSheet from './MicroLessonSheet';
import { sounds } from '../utils/audio';
import { ORG_CONFIG } from '../config/orgConfig';
import { findBestVisualMatch } from '../utils/visualLibraryMatcher';
import './guruji-work-coach.css';

interface SimulatorScreenProps {
  initialPhase?: number; // 0: Show me (WATCH), 1: Guide me (YOUR TURN), 2: Test me (SOLO CHECK)
  lesson?: Lesson;
  customSteps?: SimulatorStep[];
  sourceMeta?: SourceMeta;
  onClose: () => void;
  onFinish: (score: number) => void;
  onOpenBasics?: () => void;
  onAskTrainer?: () => void;
}

export default function SimulatorScreen({
  initialPhase = 1,
  lesson,
  customSteps,
  sourceMeta,
  onClose,
  onFinish,
  onOpenBasics,
  onAskTrainer,
}: SimulatorScreenProps) {
  // Determine steps pool strictly from lesson / customSteps or fallback
  const derivedSteps: SimulatorStep[] =
    customSteps ||
    (lesson?.blueprint?.scenarios
      ? initialPhase === 0
        ? lesson.blueprint.scenarios.watch
        : lesson.blueprint.scenarios.practice
      : lesson?.stepObjects && lesson.stepObjects.length > 0
      ? lesson.stepObjects.map((so: any, idx: number) => ({
          id: idx + 1,
          title: so.title || `Step ${idx + 1}`,
          type: 'check',
          question: so.question || `How do you execute step ${idx + 1}?`,
          taskTitle: lesson.title,
          taskOrder: `SOP Step ${idx + 1}`,
          taskItem: so.screen?.info || so.title,
          targetCode: `STEP-${idx + 1}`,
          targetQty: 1,
          sku: `SOP-${idx + 1}`,
          choices: (so.options && so.options.length >= 2)
            ? so.options.map((opt: any, oIdx: number) => ({
                id: opt.id || `c${oIdx + 1}`,
                title: opt.label || opt.text,
                subtitle: oIdx === 0 ? 'Compliant SOP Standard' : 'Non-compliant Action',
                isCorrect: opt.id === so.correct || oIdx === 0,
              }))
            : [
                { id: 'c1', title: so.title || 'Execute compliant SOP step', subtitle: `${lesson.title} Standard Procedure`, isCorrect: true },
                { id: 'c2', title: `Skip step ${idx + 1} to save time`, subtitle: 'Non-compliant Shortcut', isCorrect: false },
                { id: 'c3', title: `Bypass verification check`, subtitle: 'Unapproved Workaround', isCorrect: false },
              ],
          why: so.why || 'Follow standard operating procedure guidelines.',
          coachTip: so.coach_say || 'Verify required criteria before proceeding.',
          hint: so.hint || `Refer to ${lesson.title} written SOP`,
          priority: 'Standard',
        }))
      : initialPhase === 0
      ? SIMULATION_STEPS
      : SIMULATION_STEPS_B);

  const [phase, setPhase] = useState<number>(initialPhase);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [consecutiveWrongTaps, setConsecutiveWrongTaps] = useState<number>(0);
  const [hasWrongTapCurrentStep, setHasWrongTapCurrentStep] = useState<boolean>(false);
  const [hintUsedCurrentStep, setHintUsedCurrentStep] = useState<boolean>(false);
  const [safetyMissesMap, setSafetyMissesMap] = useState<Record<number, number>>({});
  const [autoHandoffReason, setAutoHandoffReason] = useState<string | null>(null);
  const [missedSteps, setMissedSteps] = useState<number[]>([]);
  const [safetyMissedInTest, setSafetyMissedInTest] = useState<boolean>(false);
  
  // Selected choice and choice interaction states
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [disabledChoiceIds, setDisabledChoiceIds] = useState<string[]>([]);
  const [coachStatus, setCoachStatus] = useState<'idle' | 'correct' | 'wrong' | 'coach'>('idle');
  const [coachSpeech, setCoachSpeech] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isBubbleBad, setIsBubbleBad] = useState<boolean>(false);
  

  // Modals inside simulator
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  const [isMicroLessonOpen, setIsMicroLessonOpen] = useState(false);

  const [activeStepPool, setActiveStepPool] = useState<SimulatorStep[]>(derivedSteps);

  useEffect(() => {
    setActiveStepPool(derivedSteps);
  }, [lesson, customSteps, initialPhase]);

  const step: SimulatorStep = activeStepPool[stepIndex] || activeStepPool[0];
  const [typedQuestion, setTypedQuestion] = useState("");
  useEffect(() => {
    setTypedQuestion("");
    const currentQ = step?.question || step?.title || "";
    let i = 0;
    const timer = setInterval(() => {
      if (i < currentQ.length) {
        setTypedQuestion(currentQ.substring(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 15);
    return () => clearInterval(timer);
  }, [stepIndex, step]);

  // Initialize step & phase behavior
  useEffect(() => {
    setSelectedChoiceId(null);
    setDisabledChoiceIds([]);
    setCoachStatus('idle');
    setHasWrongTapCurrentStep(false);
    setHintUsedCurrentStep(false);
    setIsBubbleBad(false);

    if (phase === 0) {
      // SHOW ME (WATCH / Demo): Coach demonstrates, learner watches.
      setCoachSpeech(step.why || 'Watch the demonstrated action.');
      const timer = setTimeout(() => {
        const correctChoice = step.choices.find((c) => c.isCorrect);
        if (correctChoice) {
          setSelectedChoiceId(correctChoice.id);
          setCoachStatus('correct');
          sounds.playCorrect();
        }
      }, 850);
      return () => clearTimeout(timer);
    } else if (phase === 1) {
      // GUIDE ME (YOUR TURN): Practice with hints
      setCoachSpeech(step.coachTip || 'I’m watching.');
    } else {
      // TEST ME (SOLO CHECK): Solo Assessment
      setCoachSpeech('Solo Assessment: Confirm each step without hints. One attempt per line.');
    }
  }, [stepIndex, phase, activeStepPool, step]);

  const triggerAutoHandoff = (reason: string) => {
    setAutoHandoffReason(reason);
    setIsTrainerModalOpen(true);
    sounds.playWrong();
  };

  const handleChoiceClick = (choiceId: string, isCorrect: boolean) => {
    if (disabledChoiceIds.includes(choiceId)) return;
    if (selectedChoiceId && phase === 2) return; // In Test Me, strict one attempt

    setSelectedChoiceId(choiceId);

    if (isCorrect) {
      sounds.playCorrect();
      setCoachStatus('correct');
      setConsecutiveWrongTaps(0);

      if (phase === 0) {
        setScore((prev) => prev + ORG_CONFIG.points.knowIt);
      } else if (phase === 1) {
        const pointsEarned =
          hasWrongTapCurrentStep || hintUsedCurrentStep
            ? ORG_CONFIG.points.guideMeWithMistakeOrHint
            : ORG_CONFIG.points.guideMeFirstTry;
        setScore((prev) => prev + pointsEarned);
      } else if (phase === 2) {
        setScore((prev) => prev + 15);
      }

      setCoachSpeech(phase === 2 ? 'Done.' : step.why || 'Correct! Proceed to next step.');
    } else {
      sounds.playWrong();
      setCoachStatus('wrong');
      setIsBubbleBad(true);
      setTimeout(() => setIsBubbleBad(false), 600);

      setHasWrongTapCurrentStep(true);
      const nextConsecutiveWrong = consecutiveWrongTaps + 1;
      setConsecutiveWrongTaps(nextConsecutiveWrong);

      const isSafetyOrComplianceStep =
        step.type === 'scan' ||
        step.type === 'shortage' ||
        step.title.toLowerCase().includes('safety') ||
        step.title.toLowerCase().includes('short');

      if (isSafetyOrComplianceStep) {
        setSafetyMissedInTest(true);
        const currentMisses = (safetyMissesMap[stepIndex] || 0) + 1;
        setSafetyMissesMap((prev) => ({ ...prev, [stepIndex]: currentMisses }));

        if (currentMisses >= ORG_CONFIG.handoffTriggers.safetyStepMissedLimit) {
          triggerAutoHandoff(
            `Safety/Compliance step "${step.title}" missed twice. Trainer intervention requested.`
          );
        }
      }

      if (nextConsecutiveWrong >= ORG_CONFIG.handoffTriggers.consecutiveWrongTapsLimit) {
        triggerAutoHandoff('3 consecutive incorrect selections. Trainer assistance triggered.');
      }

      if (!missedSteps.includes(stepIndex)) {
        setMissedSteps((prev) => [...prev, stepIndex]);
      }

      if (phase === 1) {
        // Build specific hint from step data or distractor context
        let msg = 'Stop. Check the task details.';
        if (step.type === 'location') msg = 'Look at the location code one part at a time: aisle → bay → bin.';
        else if (step.type === 'sku') msg = 'Do not choose by appearance. Match the SKU.';
        else if (step.type === 'qty') msg = 'The task quantity is shown above. Confirm the exact number.';
        else if (step.type === 'shortage') msg = 'Pick what is physically there, then report the shortage.';
        else if (step.type === 'tote') msg = 'Match the tote to the order number. Do not mix orders.';
        else if (step.hint) msg = `Not quite. ${step.hint}`;

        setCoachSpeech(msg);
        setDisabledChoiceIds((prev) => [...prev, choiceId]);
        setTimeout(() => {
          setSelectedChoiceId(null);
        }, 1200);
      } else {
        setCoachSpeech(`No hint in solo check. The correct action was: ${step.why}`);
      }
    }
  };

  const handleShowMe = () => {
    sounds.playTap();
    setHintUsedCurrentStep(true);
    setCoachStatus('coach');
    setCoachSpeech(step.why || 'Check the task requirements above.');
    sounds.speak(step.why || 'Check task requirements');
  };

  const handleNextStep = () => {
    sounds.playTap();
    if (stepIndex < activeStepPool.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      sounds.playCorrect();
      setIsCompleted(true);
      if (phase === 2) {
        onFinish(score);
        sounds.playFanfare();
      }
    }
  };

  const handlePrevStep = () => {
    sounds.playTap();
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    } else {
      onClose();
    }
  };

  const handleRestartFull = (targetPhase: number = 1) => {
    sounds.playTap();
    setPhase(targetPhase);
    setActiveStepPool(derivedSteps);
    setStepIndex(0);
    setScore(0);
    setMissedSteps([]);
    setIsCompleted(false);
  };

  // Helper icon map
  const getStepIcon = (type: string, priority?: string) => {
    const map: Record<string, string> = {
      menu: '▣',
      orders: '≡',
      location: '⌖',
      scan: '⌕',
      sku: '◇',
      qty: '#',
      shortage: '!',
      tote: '▤',
      handover: '→',
      bottle: '🧴',
      spray: '🚿',
      wipe: '🧹',
      safety: '🛡️',
      check: '✓',
    };
    return map[type?.toLowerCase()] || (priority?.toLowerCase().includes('crit') ? '!' : '▣');
  };

  // Visual slot renderer (Domain-Aware Cards + Smart Visual Photo Library Matcher)
  const renderVisualSlot = (currentStep: SimulatorStep) => {
    const textContext = `${currentStep.title} ${currentStep.question} ${currentStep.why || ""} ${currentStep.taskTitle || ""} ${currentStep.taskItem || ""}`;
    const overallContext = `${lesson?.title || ""} ${lesson?.category || ""} ${lesson?.description || ""}`;
    const { url } = findBestVisualMatch(textContext, overallContext);
    return (
      <div className="w-full flex flex-col gap-3 mb-4">
        {url ? (
          <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-800 shadow-lg bg-slate-950 shrink-0">
            <img src={url} alt={currentStep.title} className="w-full h-full object-cover" />
          </div>
        ) : null}
      </div>
    );
  };

  // Phase Title Helper
  const getPhaseTitle = (p: number) => {
    if (p === 0) return 'WATCH';
    if (p === 1) return 'YOUR TURN';
    return 'SOLO CHECK';
  };

  const categoryName = lesson?.category || 'SOP';

  // Completion Assessment Screen (Screenshot 4)
  if (isCompleted) {
    const totalStepsCount = activeStepPool.length;
    const firstTimeCorrectCount = Math.max(0, totalStepsCount - missedSteps.length);
    const accuracyPct = Math.round((firstTimeCorrectCount / totalStepsCount) * 100);
    const isReady = firstTimeCorrectCount >= Math.ceil(totalStepsCount * 0.8) && !safetyMissedInTest;

    const missedStepItems = activeStepPool.filter((_, idx) => missedSteps.includes(idx));

    return (
      <div className="fixed inset-0 z-50 bg-[#1b1b1c] overflow-y-auto guruji-coach-wrapper">
        <div className="guruji-coach-app">
          {/* Header */}
          <header className="header">
            <div className="brand">GURUJI · WORK COACH</div>
            <div className="live">
              <i></i>RESULT
            </div>
          </header>

          <main className="report">
            {/* Readiness Card */}
            <div className="readiness">
              <span className={`readyPill ${isReady ? '' : 'coaching'}`}>
                {isReady ? 'READY FOR THE FLOOR' : 'COACHING NEEDED'}
              </span>
              <div className="score">
                {firstTimeCorrectCount}
                <span> / {totalStepsCount} first-time correct</span>
              </div>
              <div className="metrics">
                <div className="metric">
                  <small>Accuracy</small>
                  <b>{accuracyPct}%</b>
                </div>
                <div className="metric">
                  <small>Support</small>
                  <b>{missedSteps.length ? `${missedSteps.length} steps` : 'None'}</b>
                </div>
              </div>
            </div>

            {/* Focus List */}
            <div className="fix">
              <h3>{missedSteps.length ? 'Focus before the next shift' : 'Strong work'}</h3>
              {missedSteps.length > 0 ? (
                missedStepItems.map((ms, idx) => (
                  <div className="fixRow" key={idx}>
                    <b>{ms.title}</b>
                    <span>{ms.why}</span>
                  </div>
                ))
              ) : (
                <div className="fixRow">
                  <b>Independent Execution</b>
                  <span>You completed all critical operational decisions without intervention.</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="introActions">
              {phase === 0 ? (
                <button className="primary" onClick={() => handleRestartFull(1)}>
                  Continue to Guide Me →
                </button>
              ) : phase === 1 ? (
                <button className="primary" onClick={() => handleRestartFull(2)}>
                  Continue to Test Me →
                </button>
              ) : (
                <button className="secondary" onClick={() => handleRestartFull(1)}>
                  Run again
                </button>
              )}
              <button
                className={phase === 0 ? 'secondary' : 'primary'}
                onClick={() => {
                  sounds.playTap();
                  onClose();
                }}
              >
                Back to overview
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Task Card Values
  const currentItemLabel = (step as any).taskTitle || step.item || step.title;
  const currentItemSub = (step as any).taskItem || (step.sku ? `SKU ${step.sku}` : step.coachTip || 'Standard Operating Action');
  const targetLabel = step.type === 'location' ? 'TARGET' : step.type === 'shortage' ? 'NEEDED' : step.type === 'tote' ? 'TOTE' : 'TARGET';
  const targetVal = step.targetCode || step.location || (step.targetQty ? `${step.targetQty} Units` : 'Standard Spec');
  const qtyVal = step.targetQty !== undefined ? String(step.targetQty) : (step.type === 'shortage' ? '2' : '✓');
  const currentPriority = step.priority || 'EXPRESS';
  const progressPct = ((stepIndex + 1) / activeStepPool.length) * 100;

  const isNextDisabled =
    (phase === 0 && selectedChoiceId === null) ||
    (phase === 1 && coachStatus !== 'correct') ||
    (phase === 2 && selectedChoiceId === null);

  return (
    <div className="fixed inset-0 z-50 bg-[#1b1b1c] overflow-y-auto guruji-coach-wrapper">
      <div className="guruji-coach-app">
        <div className="screen work">
          {/* Header */}
          <header className="header">
            <div className="brand">
              <button
                type="button"
                onClick={handlePrevStep}
                className="back-btn"
                aria-label="Go back to previous step"
                title="Go back"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  onClose();
                }}
                className="cancel-btn"
                aria-label="Cancel session"
                title="Cancel session"
              >
                ✕ Cancel
              </button>
              <span>GURUJI · WORK COACH</span>
            </div>
            <div className="live">
              <i></i>
              {categoryName.toUpperCase()} · LIVE
            </div>
          </header>

          {/* Progress Bar with Nodes */}
          <div className="progress">
            <div className="progressLine">
              <div className="progressFill" style={{ width: `${progressPct}%` }}></div>
            </div>
            <div className="nodes">
              {activeStepPool.map((_, i) => (
                <span
                  key={i}
                  className={`node ${i < stepIndex ? 'done' : ''} ${i === stepIndex ? 'active' : ''}`}
                ></span>
              ))}
            </div>
          </div>

          {/* Task Header & Radiant Hero Task Card */}
          <section className="task">
            <div className="taskMeta">
              <span className="phase">
                <i className="dot"></i>
                {getPhaseTitle(phase)}
              </span>
              <span className="counter">
                {String(stepIndex + 1).padStart(2, '0')} / {String(activeStepPool.length).padStart(2, '0')}
              </span>
            </div>

            <div
              className={`taskCard heroTask ${
                coachStatus === 'correct'
                  ? 'state-correct'
                  : coachStatus === 'wrong'
                  ? 'state-wrong'
                  : coachStatus === 'coach'
                  ? 'state-coach'
                  : ''
              }`}
            >
              <div className="heroInner">
                <div className="taskHead">
                  <div>
                    <h2 className="taskTitle">{step.title}</h2>
                    <div className="taskSub">
                      {(step as any).taskOrder || lesson?.title || 'SOP'} · {step.item || step.sku || 'Standard Task'}
                    </div>
                  </div>
                  <span className="priority">{currentPriority}</span>
                </div>

                <div className="item">
                  <div className="itemIcon">{getStepIcon(step.type, step.priority)}</div>
                  <div>
                    <b>{currentItemLabel}</b>
                    <span>{currentItemSub}</span>
                  </div>
                </div>

                {step.type !== 'menu' && (
                  <div className="target">
                    <div className="targetBox">
                      <label>{targetLabel}</label>
                      <strong>{targetVal}</strong>
                    </div>
                    <div className="targetBox qty">
                      <label>Qty</label>
                      <strong>{qtyVal}</strong>
                    </div>
                  </div>
                )}

                
              </div>
            </div>
          </section>

          {/* Action Section */}
          <section className="action">
            {renderVisualSlot(step)}

            <h3 className="question">{typedQuestion}</h3>

            {/* Choices Grid */}
            <div className="choices">
              {step.choices.map((choice, index) => {
                const isSelected = selectedChoiceId === choice.id;
                const isDisabled = disabledChoiceIds.includes(choice.id);

                let choiceStateClass = '';
                if (isSelected) {
                  choiceStateClass = choice.isCorrect ? 'correct' : 'wrong';
                } else if (isDisabled) {
                  choiceStateClass = 'disabled';
                }

                return (
                  <button
                    key={choice.id}
                    style={{
                      animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                      animationDelay: `${index * 120}ms`,
                      opacity: 0
                    }}
                    className={`choice ${choiceStateClass}`.trim()}
                    onClick={() => handleChoiceClick(choice.id, choice.isCorrect)}
                    disabled={
                      phase === 0 ||
                      isDisabled ||
                      (selectedChoiceId !== null && phase === 2)
                    }
                  >
                    <div>
                      <strong>{choice.title}</strong>
                      {choice.subtitle && <small>{choice.subtitle}</small>}
                    </div>

                    {isSelected && (
                      <span className="mark">
                        {choice.isCorrect ? '✓' : '×'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Guruji Coaching Bubble */}
            <div className="guru" id="guru">
              <div className="gMark">G</div>
              <div className={`gBubble ${isBubbleBad ? 'bad' : ''}`}>
                <b>GURUJI</b>
                <span>{coachSpeech}</span>
              </div>
            </div>
          </section>

          {/* Bottom Action Footer */}
          <div className="bottom">
            {phase === 1 && (
              <button className="showMe" onClick={handleShowMe}>
                Show me hint
              </button>
            )}

            <div className="bottom-controls">
              <button
                type="button"
                className="btn-back-action"
                onClick={handlePrevStep}
                aria-label="Back to previous step"
              >
                ← Back
              </button>
              <button
                type="button"
                className="btn-cancel-action"
                onClick={() => {
                  sounds.playTap();
                  onClose();
                }}
                aria-label="Cancel session"
              >
                Cancel
              </button>
              <button
                type="button"
                className="next"
                onClick={handleNextStep}
                disabled={isNextDisabled}
              >
                {stepIndex === activeStepPool.length - 1 ? 'Finish' : 'Continue →'}
              </button>
            </div>
          </div>
        </div>

        {/* Integrated Trainer & Micro-lesson Modals */}
        <AskTrainerModal
          isOpen={isTrainerModalOpen}
          onClose={() => setIsTrainerModalOpen(false)}
          currentStepTitle={step.title}
          triggerReason={autoHandoffReason || undefined}
        />

        <MicroLessonSheet
          isOpen={isMicroLessonOpen}
          onClose={() => setIsMicroLessonOpen(false)}
          onOpenBasics={() => {
            setIsMicroLessonOpen(false);
            if (onOpenBasics) onOpenBasics();
          }}
          onAskTrainer={() => {
            setIsMicroLessonOpen(false);
            setIsTrainerModalOpen(true);
          }}
        />
      </div>
    </div>
  );
}
