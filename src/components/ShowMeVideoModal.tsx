import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  CheckCircle2
} from 'lucide-react';
import { Lesson } from '../types';

interface ShowMeVideoModalProps {
  isOpen: boolean;
  lesson: Lesson;
  onClose: () => void;
  onContinueToGuideMe?: () => void;
}

export interface OperationalScene {
  stepNumber: number;
  title: string;
  section: string;
  instruction: string;
  keyVerification: string;
  durationSeconds: number;
  imageUrl: string;
}

// 4 Canonical Operational Demonstration Scenes
const DEMONSTRATION_SCENES: OperationalScene[] = [
  {
    stepNumber: 1,
    title: "Prepare the Boarding Operation",
    section: "Section 2 — Prepare",
    instruction: "Verify assigned flight number, gate status, scheduled departure time, and confirm communication channel with supervisor and equipment readiness.",
    keyVerification: "What is checked, where information is verified, and what readiness looks like.",
    durationSeconds: 10,
    imageUrl: "/demonstration_scenes/scene_1.png",
  },
  {
    stepNumber: 2,
    title: "Authorise and Begin Boarding",
    section: "Section 3 — Perform",
    instruction: "Receive authorised instruction before initiating passenger boarding, deliver the required boarding announcement, and provide clear boarding instructions.",
    keyVerification: "The sequence from supervisor authorisation to passenger communication.",
    durationSeconds: 10,
    imageUrl: "/demonstration_scenes/scene_2.png",
  },
  {
    stepNumber: 3,
    title: "Verify Boarding Documents",
    section: "Sections 3, 4 and 6",
    instruction: "Check boarding documents using the approved verification process. When a document mismatch is detected, pause boarding and seek authorised resolution.",
    keyVerification: "The verification action and the boundary between routine processing and escalation.",
    durationSeconds: 12,
    imageUrl: "/demonstration_scenes/scene_3.png",
  },
  {
    stepNumber: 4,
    title: "Apply the Stop-and-Escalate Rule",
    section: "Sections 4, 7 and Mandatory Safety",
    instruction: "When a safety, security, or integrity concern occurs: STOP operations immediately → PROTECT people and security → INFORM authorised supervisor → RESUME only when cleared.",
    keyVerification: "The compliant stop-and-escalate response without improvisation.",
    durationSeconds: 12,
    imageUrl: "/demonstration_scenes/scene_4.png",
  },
];

export const ShowMeVideoModal: React.FC<ShowMeVideoModalProps> = ({
  isOpen,
  lesson,
  onClose,
  onContinueToGuideMe,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isSequenceComplete, setIsSequenceComplete] = useState(false);

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const currentScene = DEMONSTRATION_SCENES[currentStepIndex] || DEMONSTRATION_SCENES[0];
  const totalSteps = DEMONSTRATION_SCENES.length;

  useEffect(() => {
    if (!isOpen) return;
    setCurrentStepIndex(0);
    setIsPlaying(true);
    setIsSequenceComplete(false);
    setPlaybackProgress(0);
    startTimeRef.current = Date.now();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isPlaying || isSequenceComplete) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    startTimeRef.current = Date.now() - playbackProgress * currentScene.durationSeconds * 1000;

    progressTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const progress = Math.min(1, elapsed / currentScene.durationSeconds);
      setPlaybackProgress(progress);

      if (progress >= 1) {
        clearInterval(progressTimerRef.current!);
        handleAdvanceToNextScene();
      }
    }, 100);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isOpen, isPlaying, currentStepIndex, isSequenceComplete, currentScene.durationSeconds]);

  const handleAdvanceToNextScene = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setPlaybackProgress(0);
      startTimeRef.current = Date.now();
    } else {
      setIsPlaying(false);
      setIsSequenceComplete(true);
      setPlaybackProgress(1);
    }
  };

  const handleReplay = () => {
    setCurrentStepIndex(0);
    setPlaybackProgress(0);
    setIsSequenceComplete(false);
    setIsPlaying(true);
    startTimeRef.current = Date.now();
  };

  const handleSelectStep = (idx: number) => {
    setCurrentStepIndex(idx);
    setPlaybackProgress(0);
    setIsSequenceComplete(false);
    setIsPlaying(true);
    startTimeRef.current = Date.now();
  };

  const togglePlayPause = () => {
    if (isSequenceComplete) {
      handleReplay();
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 sm:p-5 select-none animate-in fade-in duration-200">
      
      {/* Container */}
      <div className="w-full max-w-4xl h-[94vh] sm:h-[88vh] bg-[#0A0D14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between relative">
        
        {/* 1. CLEAN APPLE HEADER (NO header text, NO title, NO step counter, ONLY small back icon) */}
        <header className="px-5 py-3 flex items-center justify-between border-b border-white/[0.06] bg-black/30 shrink-0">
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Back"
            aria-label="Back"
          >
            <ChevronLeft size={16} />
          </button>
          <div>{/* Empty space - Clean header with no text */}</div>
        </header>

        {/* 2. BODY CONTAINER: EXACT 60:40 HEIGHT RATIO (Video : Text) */}
        <div className="flex-1 overflow-hidden p-4 sm:p-5 flex flex-col gap-4 min-h-0 relative">
          
          {/* A. VIDEO STAGE: Exactly 60% Height Ratio */}
          <div className="h-[60%] flex-[6] w-full bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group flex items-center justify-center shrink-0 min-h-0">
            <img
              src={currentScene.imageUrl}
              alt={currentScene.title}
              className={`w-full h-full object-cover transition-transform duration-10000 ease-out ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
            />

            {/* Subtle Controls Overlay on Hover or Pause */}
            <div className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex items-center justify-between transition-opacity duration-200 ${
              isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
            }`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayPause}
                  className="w-8 h-8 rounded-full bg-white/25 hover:bg-white/35 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} className="translate-x-0.5" />}
                </button>

                <button
                  onClick={handleReplay}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Replay sequence"
                >
                  <RotateCcw size={13} />
                </button>
              </div>

              <div className="text-[11px] font-mono text-zinc-300 bg-black/60 px-2.5 py-0.5 rounded-full border border-white/10">
                {Math.round(playbackProgress * currentScene.durationSeconds)}s / {currentScene.durationSeconds}s
              </div>
            </div>
          </div>

          {/* B. INSTRUCTION TEXT CARD: Exactly 40% Height Ratio */}
          <div className="h-[40%] flex-[4] overflow-y-auto bg-[#0E121E]/90 border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-2 shrink-0 min-h-0">
            <div className="space-y-2">
              {/* Section Header */}
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-bold tracking-widest text-blue-400 uppercase text-[11px]">
                  {currentScene.section}
                </span>
                <span className="font-mono text-zinc-500 text-[11px]">
                  {currentScene.durationSeconds}s
                </span>
              </div>

              {/* Step Title */}
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
                {currentScene.title}
              </h3>

              {/* Operational Directive */}
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal">
                {currentScene.instruction}
              </p>
            </div>

            {/* Learner Focus Footer */}
            <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Learner Focus
              </span>
              <p className="text-xs text-zinc-300 leading-normal truncate">
                {currentScene.keyVerification}
              </p>
            </div>
          </div>

        </div>

        {/* 3. TIMELINE PROGRESS BAR FOOTER */}
        <footer className="px-5 py-3 border-t border-white/[0.06] bg-black/50 shrink-0">
          <div className="grid grid-cols-4 gap-2 w-full">
            {DEMONSTRATION_SCENES.map((sc, idx) => {
              const isPassed = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const progressFill = isPassed ? 100 : isCurrent ? playbackProgress * 100 : 0;

              return (
                <button
                  key={sc.stepNumber}
                  onClick={() => handleSelectStep(idx)}
                  className="flex flex-col gap-1 text-left cursor-pointer group"
                >
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-100"
                      style={{ width: `${progressFill}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-0.5">
                    <span className={`font-semibold truncate transition-colors ${
                      isCurrent ? 'text-white' : isPassed ? 'text-zinc-400' : 'text-zinc-600'
                    }`}>
                      0{sc.stepNumber}. {sc.title.split(' ')[0]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </footer>

        {/* 4. ENDING SCREEN / COMPLETION OVERLAY (EXACTLY MATCHES SCREENSHOT 1) */}
        {isSequenceComplete && (
          <div className="absolute inset-0 z-50 bg-[#0E1116]/90 backdrop-blur-2xl flex flex-col items-center justify-between p-6 sm:p-8 animate-in fade-in duration-300">
            {/* Top Bar with small close chevron icon */}
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                title="Close"
                aria-label="Close"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            {/* Center Content Matching Screenshot 1 layout */}
            <div className="flex flex-col items-center justify-center text-center max-w-md my-auto space-y-5">
              {/* Animated Progress Ring Spinner */}
              <div className="relative w-20 h-20 flex items-center justify-center mb-2">
                <div className="absolute inset-0 rounded-full border-4 border-white/15"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-indigo-400 animate-spin"></div>
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <CheckCircle2 size={22} />
                </div>
              </div>

              {/* Headline - Replaced "Analyzing document..." with "Completed document..." */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Completed document...
              </h2>

              {/* Subtitle */}
              <p className="text-sm text-zinc-300 leading-relaxed max-w-xs">
                Building your operational training experience.
              </p>

              {/* Action Pill Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
                {onContinueToGuideMe ? (
                  <button
                    onClick={onContinueToGuideMe}
                    className="px-8 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Make the Decision</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-8 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all cursor-pointer"
                  >
                    Done
                  </button>
                )}

                <button
                  onClick={handleReplay}
                  className="px-6 py-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/15 text-white text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Replay</span>
                </button>
              </div>
            </div>

            {/* Bottom spacer */}
            <div className="h-6"></div>
          </div>
        )}

      </div>
    </div>
  );
};
