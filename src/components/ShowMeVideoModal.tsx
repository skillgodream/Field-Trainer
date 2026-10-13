import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  ArrowRight,
  ArrowLeft,
  Volume2,
  VolumeX,
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

// 4 Canonical Operational Demonstration Scenes with Photorealistic 4K Visuals
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

  // Initialize playback on open
  useEffect(() => {
    if (!isOpen) return;

    setCurrentStepIndex(0);
    setIsPlaying(true);
    setIsSequenceComplete(false);
    setPlaybackProgress(0);
    startTimeRef.current = Date.now();
  }, [isOpen]);

  // Hands-free continuous progression timer (Runs all 4 scenes automatically)
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

      // When current scene reaches its maximum duration, automatically transition to next
      if (progress >= 1) {
        clearInterval(progressTimerRef.current!);
        handleAdvanceToNextScene();
      }
    }, 100);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isOpen, isPlaying, currentStepIndex, isSequenceComplete, currentScene.durationSeconds]);

  // Advance to next scene without user intervention
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

  // Replay continuous demonstration
  const handleReplay = () => {
    setCurrentStepIndex(0);
    setPlaybackProgress(0);
    setIsSequenceComplete(false);
    setIsPlaying(true);
    startTimeRef.current = Date.now();
  };

  // Select specific step
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
      
      {/* Apple Minimalist Dark Slate Container - Zero Clutter, Zero Pills */}
      <div className="w-full max-w-4xl h-[94vh] sm:h-[88vh] bg-[#0A0D14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between relative">
        
        {/* 1. CLEAN APPLE HEADER (No pills, no status badges, no backend text) */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-white/[0.08] bg-black/40 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Passenger Boarding Demonstration
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Continuous workplace visual walkthrough
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-zinc-400 font-mono">
              {currentStepIndex + 1} of {totalSteps}
            </span>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* 2. BODY: CINEMATIC PHOTOREALISTIC VIDEO SCREEN + ACTIVE STEP TEXT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-between gap-5 min-h-0">
          
          {/* A. 16:9 Widescreen Photographic Display Stage (Real Documentary Workplace Visuals) */}
          <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center group shrink-0">
            <img
              src={currentScene.imageUrl}
              alt={currentScene.title}
              className={`w-full h-full object-cover transition-transform duration-10000 ease-out ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
            />

            {/* Sequence Finished Overlay */}
            {isSequenceComplete && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 z-30">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                  Demonstration Sequence Complete
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 max-w-sm mb-5 leading-relaxed">
                  All 4 continuous operational scenes completed. Ready to proceed to practical decision practice?
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReplay}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border border-white/15"
                  >
                    <RotateCcw size={14} />
                    <span>Replay</span>
                  </button>
                  {onContinueToGuideMe && (
                    <button
                      onClick={onContinueToGuideMe}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/30"
                    >
                      <span>Make the Decision</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Subtle Controls Bar on Hover or Pause */}
            <div className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 sm:p-4 flex items-center justify-between transition-opacity duration-200 ${
              isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
            }`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayPause}
                  className="w-9 h-9 rounded-full bg-white/25 hover:bg-white/35 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} className="translate-x-0.5" />}
                </button>

                <button
                  onClick={handleReplay}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Replay sequence"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              <div className="text-xs font-mono text-zinc-300 bg-black/60 px-3 py-1 rounded-full border border-white/10">
                {Math.round(playbackProgress * currentScene.durationSeconds)}s / {currentScene.durationSeconds}s
              </div>
            </div>
          </div>

          {/* B. SINGLE SYNCHRONIZED STEP TEXT (Quiet, Elegant, Zero Pills) */}
          <div className="space-y-3 bg-[#0E121E]/80 border border-white/[0.08] rounded-2xl p-4 sm:p-5">
            {/* Clean Tracked Header (No pill borders) */}
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold tracking-widest text-blue-400 uppercase text-[11px]">
                {currentScene.section}
              </span>
              <span className="font-mono text-zinc-500">
                {currentScene.durationSeconds}s
              </span>
            </div>

            {/* Step Title */}
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {currentScene.title}
            </h3>

            {/* Operational Directive */}
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal pt-0.5">
              {currentScene.instruction}
            </p>

            {/* Key Verification Focus Box */}
            <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Learner Focus
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {currentScene.keyVerification}
              </p>
            </div>
          </div>

        </div>

        {/* 3. APPLE MULTI-SEGMENT CONTINUOUS TIMELINE (Bottom Progress Line) */}
        <footer className="px-6 py-4 border-t border-white/[0.08] bg-black/50 shrink-0">
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
                  {/* Thin Clean Apple Progress Line */}
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-100"
                      style={{ width: `${progressFill}%` }}
                    />
                  </div>

                  {/* Clean Plain Text Label (No Pills) */}
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className={`font-semibold truncate transition-colors ${
                      isCurrent ? 'text-white' : isPassed ? 'text-zinc-400' : 'text-zinc-600'
                    }`}>
                      0{sc.stepNumber}. {sc.title.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                      {sc.durationSeconds}s
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </footer>

      </div>
    </div>
  );
};
