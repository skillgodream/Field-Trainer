import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  ArrowLeft, 
  Lightbulb, 
  Award,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { SIMULATION_STEPS, SIMULATION_STEPS_B } from '../data/lessonsData';
import { SimulatorStep, Lesson, SourceMeta } from '../types';
import AskTrainerModal from './AskTrainerModal';
import MicroLessonSheet from './MicroLessonSheet';
import { sounds } from '../utils/audio';
import { ORG_CONFIG } from '../config/orgConfig';
import { findBestVisualMatch } from '../utils/visualLibraryMatcher';

interface SimulatorScreenProps {
  initialPhase?: number; // 0: Show me (WATCH), 1: Guide me (YOUR TURN / Make the decision), 2: Test me (SOLO CHECK)
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
          type: 'bottle',
          question: so.question || `What is the compliant SOP action for step ${idx + 1}?`,
          taskTitle: lesson.title,
          taskOrder: `SOP Step ${idx + 1}`,
          taskItem: so.screen?.info || so.title,
          targetCode: `1:10 RATIO`,
          targetQty: 1,
          sku: `CHEM-SAN-10`,
          choices: (so.options && so.options.length >= 2)
            ? so.options.map((opt: any, oIdx: number) => ({
                id: opt.id || `c${oIdx + 1}`,
                title: opt.label || opt.text,
                subtitle: oIdx === 0 ? 'Standard hospital-grade dilution specification' : 'Non-compliant action',
                isCorrect: opt.id === so.correct || oIdx === 0,
              }))
            : [
                { id: 'c1', title: '1:10 Standard Sanitizer Ratio', subtitle: 'Standard hospital-grade dilution specification', isCorrect: true },
                { id: 'c2', title: '1:5 Concentrated Ratio', subtitle: 'Too concentrated, leaves toxic residue', isCorrect: false },
                { id: 'c3', title: '1:20 Diluted Ratio', subtitle: 'Too weak, pathogen survival risk', isCorrect: false },
              ],
          why: so.why || 'Follow standard operating procedure guidelines.',
          coachTip: so.coach_say || 'Measure precisely using the standard dilution mark.',
          hint: so.hint || `Refer to ${lesson.title} written SOP`,
          priority: 'CRITICAL',
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
  
  // Selected choice and confirmed answer state
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState<boolean>(false);
  const [disabledChoiceIds, setDisabledChoiceIds] = useState<string[]>([]);
  const [coachStatus, setCoachStatus] = useState<'idle' | 'correct' | 'wrong' | 'coach'>('idle');
  const [coachSpeech, setCoachSpeech] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Modals inside simulator
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  const [isMicroLessonOpen, setIsMicroLessonOpen] = useState(false);

  const [activeStepPool, setActiveStepPool] = useState<SimulatorStep[]>(derivedSteps);

  useEffect(() => {
    setActiveStepPool(derivedSteps);
  }, [lesson, customSteps, initialPhase]);

  const step: SimulatorStep = activeStepPool[stepIndex] || activeStepPool[0];

  // Initialize step & phase behavior
  useEffect(() => {
    setSelectedChoiceId(null);
    setIsAnswerConfirmed(false);
    setDisabledChoiceIds([]);
    setCoachStatus('idle');
    setHasWrongTapCurrentStep(false);
    setHintUsedCurrentStep(false);

    if (phase === 0) {
      // SHOW ME (WATCH / Demo): Coach demonstrates, learner watches.
      setCoachSpeech(step?.why || 'Watch the demonstrated action.');
      const timer = setTimeout(() => {
        const correctChoice = step?.choices.find((c) => c.isCorrect);
        if (correctChoice) {
          setSelectedChoiceId(correctChoice.id);
          setIsAnswerConfirmed(true);
          setCoachStatus('correct');
          sounds.playCorrect();
        }
      }, 750);
      return () => clearTimeout(timer);
    } else if (phase === 1) {
      // GUIDE ME (MAKE THE DECISION): Practice with hints
      setCoachSpeech(step?.coachTip || 'Evaluate the situation and choose the compliant action.');
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

  const handleSelectChoice = (choiceId: string) => {
    if (disabledChoiceIds.includes(choiceId)) return;
    if (isAnswerConfirmed && coachStatus === 'correct') return; // already solved

    sounds.playTap();
    setSelectedChoiceId(choiceId);
    // If previously marked wrong, reset confirmation state so user can confirm new choice
    if (coachStatus === 'wrong') {
      setIsAnswerConfirmed(false);
      setCoachStatus('idle');
    }
  };

  const handleConfirmAnswer = () => {
    if (!selectedChoiceId) return;
    const choice = step.choices.find(c => c.id === selectedChoiceId);
    if (!choice) return;

    setIsAnswerConfirmed(true);

    if (choice.isCorrect) {
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

      setCoachSpeech(phase === 2 ? 'Step verified compliant.' : step.why || 'Correct! Dilution specification verified.');
    } else {
      sounds.playWrong();
      setCoachStatus('wrong');
      setHasWrongTapCurrentStep(true);
      const nextConsecutiveWrong = consecutiveWrongTaps + 1;
      setConsecutiveWrongTaps(nextConsecutiveWrong);

      const isSafetyOrComplianceStep =
        step.type === 'scan' ||
        step.type === 'shortage' ||
        step.title?.toLowerCase().includes('safety') ||
        step.priority?.toLowerCase().includes('crit');

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
        let msg = step.hint ? `Not quite. ${step.hint}` : 'Not compliant with SOP standard. Review dilution requirements.';
        setCoachSpeech(msg);
        setDisabledChoiceIds((prev) => [...prev, choice.id]);
      } else {
        setCoachSpeech(`Solo check incorrect. Standard SOP specification: ${step.why}`);
      }
    }
  };

  const handleShowHint = () => {
    sounds.playTap();
    setHintUsedCurrentStep(true);
    setCoachStatus('coach');
    setCoachSpeech(step.hint || step.why || 'Review the target ratio and SKU on the card above.');
    sounds.speak(step.hint || step.why || 'Check task requirements');
  };

  const handleNextStep = () => {
    sounds.playTap();
    if (stepIndex < activeStepPool.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      sounds.playCorrect();
      setIsCompleted(true);
      onFinish(score);
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

  const handleRestartFull = (targetPhase: number) => {
    sounds.playTap();
    setPhase(targetPhase);
    setStepIndex(0);
    setIsCompleted(false);
    setSelectedChoiceId(null);
    setIsAnswerConfirmed(false);
    setDisabledChoiceIds([]);
    setMissedSteps([]);
    setCoachStatus('idle');
  };

  // Helper icon for task
  const getTaskIcon = () => {
    if (step?.type === 'bottle' || step?.title?.toLowerCase().includes('sanitizer') || step?.title?.toLowerCase().includes('dilut')) {
      return '🧴';
    }
    if (step?.type === 'wipe' || step?.title?.toLowerCase().includes('wipe')) {
      return '🧹';
    }
    if (step?.type === 'spray' || step?.title?.toLowerCase().includes('spray')) {
      return '🚿';
    }
    if (step?.type === 'location') return '📍';
    if (step?.type === 'scan') return '🔍';
    return '🧴';
  };

  // Visual slot renderer
  const renderVisualSlot = (currentStep: SimulatorStep) => {
    const textContext = `${currentStep.title} ${currentStep.question} ${currentStep.why || ""} ${currentStep.taskTitle || ""} ${currentStep.taskItem || ""}`;
    const overallContext = `${lesson?.title || ""} ${lesson?.category || ""} ${lesson?.description || ""}`;
    const { url } = findBestVisualMatch(textContext, overallContext);
    if (!url) return null;

    return (
      <div className="w-full flex flex-col gap-2 mb-4">
        <div className="relative w-full h-40 sm:h-44 rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-slate-950 shrink-0">
          <img
            src={url}
            alt={currentStep.title}
            className="w-full h-full object-cover opacity-85"
            onError={(e) => {
              const parent = e.currentTarget.closest('.relative')?.parentElement;
              if (parent) parent.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-xs text-white/90">
            <span className="font-semibold px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[11px]">
              SOP Reference View
            </span>
            <span className="text-[11px] text-white/70">Visual Standard</span>
          </div>
        </div>
      </div>
    );
  };

  // Completion Assessment Screen
  if (isCompleted) {
    const totalStepsCount = activeStepPool.length;
    const firstTimeCorrectCount = Math.max(0, totalStepsCount - missedSteps.length);
    const accuracyPct = Math.round((firstTimeCorrectCount / totalStepsCount) * 100);
    const isReady = firstTimeCorrectCount >= Math.ceil(totalStepsCount * 0.8) && !safetyMissedInTest;

    return (
      <div className="fixed inset-0 z-50 bg-[#07090E] text-white overflow-y-auto overscroll-contain flex flex-col font-sans select-none">
        <div className="max-w-md mx-auto w-full min-h-screen flex flex-col px-4 sm:px-5 py-6 relative z-10">
          {/* Header */}
          <header className="flex items-center justify-between pb-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-400" />
              <span className="text-xs font-bold tracking-widest uppercase text-white/80">
                GURUJI · WORK COACH
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-xs font-bold text-blue-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              COMPLETED
            </div>
          </header>

          <main className="flex-1 flex flex-col justify-between py-6 space-y-6">
            <div className="bg-[#101524] border border-blue-500/30 rounded-[28px] p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🎯</span>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {isReady ? 'Floor Certified' : 'Review Needed'}
                  </h3>
                  <p className="text-xs text-white/60">
                    {isReady ? 'Ready for independent shift execution' : 'Practice key points to reach 100% compliance'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                <div className="bg-black/30 rounded-2xl p-3 border border-white/5">
                  <div className="text-[10px] uppercase font-bold text-white/50">Score</div>
                  <div className="text-xl font-black text-white">{score} pts</div>
                </div>
                <div className="bg-black/30 rounded-2xl p-3 border border-white/5">
                  <div className="text-[10px] uppercase font-bold text-white/50">Accuracy</div>
                  <div className="text-xl font-black text-emerald-400">{accuracyPct}%</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleRestartFull(1)}
                className="w-full py-4 px-6 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-xl shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Practice Again
              </button>
              <button
                onClick={() => {
                  sounds.playTap();
                  onClose();
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-sm transition-all"
              >
                Back to Lesson Overview
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Task Values
  const taskTitle = (step as any)?.taskTitle || 'Dilution Protocol';
  const taskSubtitle = (step as any)?.taskItem || 'Chemical Dilution Station';
  const targetLabel = step?.type === 'location' ? 'TARGET' : 'TARGET';
  const targetValue = step?.targetCode || '1:10 RATIO';
  const skuValue = `${step?.targetQty ? `${step.targetQty} BOTTLE ` : '1 BOTTLE '}${step?.sku ? `(${step.sku})` : '(CHEM-SAN-10)'}`;
  const priorityBadge = step?.priority || 'CRITICAL';

  // Primary action button state
  const isCorrectlyConfirmed = isAnswerConfirmed && coachStatus === 'correct';
  const canConfirm = selectedChoiceId !== null && (!isAnswerConfirmed || coachStatus === 'wrong');

  return (
    <div className="fixed inset-0 z-50 bg-[#07090E] text-white overflow-y-auto overscroll-contain flex flex-col font-sans select-none">
      {/* Background subtle radial ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-blue-600/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Main Container - Centered Mobile Frame */}
      <div className="max-w-md mx-auto w-full min-h-screen flex flex-col px-4 sm:px-5 pt-3 pb-36 relative z-10">
        
        {/* Top Navigation Bar */}
        <header className="flex items-center justify-between py-2 mb-3">
          <button
            type="button"
            onClick={handlePrevStep}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white/90 transition-all flex items-center gap-1.5 text-xs font-semibold"
            aria-label="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="text-xs font-bold text-white/70 tracking-wide uppercase">
            Step {stepIndex + 1} of {activeStepPool.length}
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all text-xs"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </header>

        {/* 1:1 Radiant Blue Hero Task Card */}
        <section className="mb-4">
          <div className="bg-gradient-to-b from-[#1D4ED8] via-[#1E40AF] to-[#1E3A8A] rounded-[28px] p-5 shadow-2xl shadow-blue-900/40 border border-blue-400/30 relative overflow-hidden">
            {/* Top Gloss Highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

            {/* Top Row: Amber Critical Badge */}
            <div className="flex items-center justify-end mb-3">
              <span className="bg-[#FBBF24] text-black font-extrabold text-[11px] px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                {priorityBadge}
              </span>
            </div>

            {/* Identity Row: Icon + Protocol Title + Subtitle */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-inner shrink-0">
                {getTaskIcon()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight truncate">
                  {taskTitle}
                </h2>
                <p className="text-xs sm:text-sm font-medium text-blue-100/80 leading-snug truncate mt-0.5">
                  {taskSubtitle}
                </p>
              </div>
            </div>

            {/* Spec Tiles Grid: Target + SKU / Quantity */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Target Tile */}
              <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200/90 flex items-center gap-1 mb-1">
                  <span>🎯</span>
                  <span>{targetLabel}</span>
                </div>
                <div className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                  {targetValue}
                </div>
              </div>

              {/* SKU / Quantity Tile */}
              <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200/90 flex items-center gap-1 mb-1">
                  <span>📦</span>
                  <span>SKU / QUANTITY</span>
                </div>
                <div className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                  {skuValue}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Visual SOP photo reference if available */}
        {renderVisualSlot(step)}

        {/* Question Heading */}
        <section className="mb-4">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400 mb-1.5 flex items-center justify-between">
            <span>QUESTION {stepIndex + 1} OF {activeStepPool.length}</span>
            {phase === 1 && (
              <button
                type="button"
                onClick={handleShowHint}
                className="text-amber-300 hover:text-amber-200 text-[11px] font-bold flex items-center gap-1"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Show Hint</span>
              </button>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
            {step.question || step.title}
          </h3>
        </section>

        {/* Answer Choices List */}
        <section className="space-y-3 mb-4">
          {step.choices.map((choice) => {
            const isSelected = selectedChoiceId === choice.id;
            const isDisabled = disabledChoiceIds.includes(choice.id);

            // Styling states
            let cardClasses = "bg-[#101422] border-white/10 hover:border-white/20 text-white";
            let radioContent = (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 flex items-center justify-center shrink-0 transition-colors" />
            );
            let badgeEl = null;

            if (isSelected) {
              if (isAnswerConfirmed) {
                if (choice.isCorrect) {
                  cardClasses = "bg-emerald-950/40 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/50";
                  radioContent = (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  );
                  badgeEl = (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                      Correct
                    </span>
                  );
                } else {
                  cardClasses = "bg-rose-950/40 border-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.2)] ring-1 ring-rose-500/50";
                  radioContent = (
                    <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  );
                  badgeEl = (
                    <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <X className="w-3 h-3 stroke-[3]" />
                      Not correct
                    </span>
                  );
                }
              } else {
                // Selected but not confirmed yet
                cardClasses = "bg-[#162038] border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.25)] ring-1 ring-blue-500";
                radioContent = (
                  <div className="w-5 h-5 rounded-full border-2 border-blue-400 bg-blue-500/20 flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  </div>
                );
              }
            } else if (isDisabled) {
              cardClasses = "bg-white/[0.03] border-white/5 opacity-40 cursor-not-allowed line-through";
            }

            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => handleSelectChoice(choice.id)}
                disabled={isDisabled || (phase === 0)}
                className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3.5 cursor-pointer active:scale-[0.99] disabled:active:scale-100 ${cardClasses}`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {radioContent}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm sm:text-base text-white leading-snug">
                      {choice.title}
                    </div>
                    {choice.subtitle && (
                      <div className="text-xs text-white/60 mt-0.5 leading-relaxed">
                        {choice.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                {badgeEl}
              </button>
            );
          })}
        </section>

        {/* Guruji Work Coach Bubble */}
        {(coachStatus !== 'idle' || coachSpeech) && (
          <div className="bg-[#101524]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-4 flex items-start gap-3 shadow-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-black text-white shadow-md shrink-0">
              G
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 mb-0.5">
                Guruji Work Coach
              </div>
              <div className="text-xs sm:text-sm text-white/90 leading-relaxed">
                {coachSpeech}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Button Dock */}
      <div className="fixed bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-black via-[#07090E]/95 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto w-full pointer-events-auto flex flex-col gap-2">
          {isCorrectlyConfirmed || phase === 0 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full py-4 px-6 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] text-white font-extrabold text-base shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              <span>{stepIndex === activeStepPool.length - 1 ? 'Finish Assessment' : 'Continue'}</span>
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmAnswer}
              disabled={!canConfirm}
              className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base shadow-xl transition-all flex items-center justify-center gap-2 ${
                canConfirm
                  ? 'bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] text-white shadow-blue-500/30 cursor-pointer'
                  : 'bg-white/10 text-white/35 border border-white/5 cursor-not-allowed shadow-none'
              }`}
            >
              <span>Confirm Answer</span>
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Integrated Trainer & Micro-lesson Modals */}
      <AskTrainerModal
        isOpen={isTrainerModalOpen}
        onClose={() => setIsTrainerModalOpen(false)}
        currentStepTitle={step?.title || 'Decision Point'}
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
  );
}
