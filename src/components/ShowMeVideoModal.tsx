import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  RotateCcw, 
  Sparkles, 
  Film, 
  Clock, 
  ArrowRight,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Lesson, VideoClipPlan } from '../types';
import { 
  getVideoBlob, 
  saveVideoBlob, 
  getClipBlob, 
  saveClipBlob, 
  removeAllLessonClips 
} from '../utils/videoCache';
import { getApiHeaders } from '../utils/apiHelper';
import { buildVeoPrompt } from '../utils/veoPromptBuilder';

interface ShowMeVideoModalProps {
  isOpen: boolean;
  lesson: Lesson;
  onClose: () => void;
  onContinueToGuideMe?: () => void;
}

type ModalState = 'prompt' | 'generating' | 'player' | 'error';

export const ShowMeVideoModal: React.FC<ShowMeVideoModalProps> = ({
  isOpen,
  lesson,
  onClose,
  onContinueToGuideMe,
}) => {
  const videoPlan = lesson.videoPlan;
  const isMultiClip = Boolean(videoPlan && videoPlan.strategy === 'sequential_steps' && videoPlan.clips && videoPlan.clips.length > 1);
  const totalClips = videoPlan?.clips?.length || 1;

  // Track cached URLs for each clip index (1-indexed)
  const [cachedUrls, setCachedUrls] = useState<Record<number, string>>({});
  const [activeClipIndex, setActiveClipIndex] = useState(1);
  const [modalState, setModalState] = useState<ModalState>('prompt');
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  
  // Single clip fallback prompt if no plan
  const buildDefaultPrompt = () => {
    if (videoPlan?.clips?.[0]?.veo_prompt) {
      return videoPlan.clips[0].veo_prompt;
    }
    const mainAction = lesson.stepObjects && lesson.stepObjects.length > 0
      ? lesson.stepObjects[0].title
      : lesson.title;

    return buildVeoPrompt({
      role: lesson.operationalBlueprint?.role || 'frontline professional',
      process: lesson.title,
      actionInstruction: mainAction,
      stepIndex: 1,
    });
  };

  const [promptText, setPromptText] = useState(buildDefaultPrompt());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [generationStage, setGenerationStage] = useState('Initiating generation...');
  const [currentRenderingClip, setCurrentRenderingClip] = useState(1);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to cleanup object URLs
  const cleanupAllUrls = () => {
    Object.values(cachedUrls).forEach(url => {
      try { URL.revokeObjectURL(url); } catch (_) {}
    });
    setCachedUrls({});
  };

  const cleanupPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  };

  // Check cache on modal open
  useEffect(() => {
    if (!isOpen) {
      cleanupAllUrls();
      cleanupPolling();
      return;
    }

    setPromptText(buildDefaultPrompt());
    setErrorMessage(null);
    setActiveClipIndex(1);
    setShowPromptEditor(false);

    let isSubscribed = true;

    async function checkCache() {
      const urlsMap: Record<number, string> = {};
      let anyFound = false;

      // 1. First check server storage (cross-device & permanent for all users)
      try {
        const srvRes = await fetch(`/api/videos/check/${encodeURIComponent(lesson.id)}`, {
          headers: getApiHeaders(),
        });
        if (srvRes.ok) {
          const text = await srvRes.text();
          if (text) {
            try {
              const srvData = JSON.parse(text);
              if (srvData.success && Array.isArray(srvData.clips) && srvData.clips.length > 0) {
                srvData.clips.forEach((clipIdx: number) => {
                  urlsMap[clipIdx] = `/api/videos/stream/${encodeURIComponent(lesson.id)}/${clipIdx}`;
                  anyFound = true;
                });
              }
            } catch (_) {}
          }
        }
      } catch (err) {
        console.warn('[Video] Server check failed, falling back to local storage:', err);
      }

      // 2. If not on server, check local browser IndexedDB
      if (!anyFound) {
        if (isMultiClip && videoPlan?.clips) {
          for (const clip of videoPlan.clips) {
            const blob = await getClipBlob(lesson.id, clip.clip_index);
            if (blob && isSubscribed) {
              urlsMap[clip.clip_index] = URL.createObjectURL(blob);
              anyFound = true;
            }
          }
        } else {
          const blob = await getVideoBlob(lesson.id);
          if (blob && isSubscribed) {
            urlsMap[1] = URL.createObjectURL(blob);
            anyFound = true;
          }
        }
      }

      if (!isSubscribed) return;

      setCachedUrls(urlsMap);

      if (anyFound) {
        setModalState('player');
      } else {
        setModalState('prompt');
      }
    }

    checkCache();

    return () => {
      isSubscribed = false;
      cleanupPolling();
    };
  }, [isOpen, lesson.id]);

  // When active clip changes in player, auto-play video
  useEffect(() => {
    if (modalState === 'player' && videoRef.current && cachedUrls[activeClipIndex]) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [activeClipIndex, modalState, cachedUrls]);

  // Safe JSON fetch helper preventing 'Unexpected end of JSON input'
  const safeFetchJson = async (url: string, options: RequestInit = {}): Promise<any> => {
    const mergedHeaders = getApiHeaders({
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    });

    const res = await fetch(url, { ...options, headers: mergedHeaders });
    const text = await res.text();

    if (!text || !text.trim()) {
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status} (${res.statusText || 'empty response'}). Check API key and server connectivity.`);
      }
      return {};
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      if (!res.ok) {
        throw new Error(`Server error (HTTP ${res.status}): ${text.slice(0, 150)}`);
      }
      throw new Error(`Invalid response format from server: ${text.slice(0, 150)}`);
    }

    if (!res.ok) {
      let rawError: any = data.error || data.message || `Request failed with HTTP ${res.status}`;
      if (typeof rawError === 'object') {
        rawError = rawError.message || rawError.details || JSON.stringify(rawError);
      }
      try {
        if (typeof rawError === 'string' && rawError.startsWith('{')) {
          const parsedInner = JSON.parse(rawError);
          if (parsedInner.error?.message) rawError = parsedInner.error.message;
        }
      } catch (_) {}

      const errString = String(rawError);
      if (
        res.status === 429 ||
        errString.includes('429') ||
        errString.includes('quota') ||
        errString.includes('RESOURCE_EXHAUSTED')
      ) {
        throw new Error('Google Veo rate limit or daily quota reached (RESOURCE_EXHAUSTED). Video generation allows 1 request per minute on preview tiers. Please wait about 60 seconds and try again.');
      }

      throw new Error(errString);
    }

    return data;
  };

  // Helper to run Veo generation for a single prompt
  const generateSingleClip = async (targetPrompt: string, clipIndex: number): Promise<Blob> => {
    // 1. Post request safely with API headers
    const startData = await safeFetchJson('/api/generate-video', {
      method: 'POST',
      body: JSON.stringify({
        prompt: targetPrompt.trim(),
        aspectRatio: '16:9',
        resolution: '720p',
      }),
    });

    if (!startData.success || !startData.operationName) {
      throw new Error(startData.error || `Failed to initiate generation for Step ${clipIndex}.`);
    }

    const operationName = startData.operationName;

    // 2. Poll until done with retry tolerance for transient network glitches
    return new Promise<Blob>((resolve, reject) => {
      let consecutivePollErrors = 0;
      const pollInterval = setInterval(async () => {
        try {
          const statusData = await safeFetchJson('/api/video-status', {
            method: 'POST',
            body: JSON.stringify({ operationName }),
          });

          consecutivePollErrors = 0; // reset on successful poll

          if (statusData.error) {
            const errDetail = typeof statusData.error === 'string'
              ? statusData.error
              : statusData.error.message || JSON.stringify(statusData.error);
            throw new Error(`Generation error for Step ${clipIndex}: ${errDetail}`);
          }

          if (statusData.done) {
            clearInterval(pollInterval);
            setGenerationStage(`Saving video to server storage...`);

            // 3. Download and save directly to server storage
            const downloadRes = await fetch('/api/video-download', {
              method: 'POST',
              headers: getApiHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({ 
                operationName,
                lessonId: lesson.id,
                clipIndex,
              }),
            });

            if (!downloadRes.ok) {
              const errText = await downloadRes.text().catch(() => '');
              throw new Error(`Failed to download Step ${clipIndex} video: HTTP ${downloadRes.status} ${errText.slice(0, 100)}`);
            }

            const videoBlob = await downloadRes.blob();
            resolve(videoBlob);
          }
        } catch (pollErr: any) {
          consecutivePollErrors++;
          console.warn(`[Video Poll Warning ${consecutivePollErrors}/4]`, pollErr);
          // Allow up to 3 transient network glitches before failing
          if (consecutivePollErrors >= 4) {
            clearInterval(pollInterval);
            reject(pollErr);
          }
        }
      }, 4000);

      pollTimerRef.current = pollInterval;
    });
  };

  // Start Generation: Generates ALL clips sequentially without human intervention
  const handleStartGeneration = async () => {
    if (videoPlan?.validation_status === 'invalid') {
      const errs = videoPlan.validation_errors || ['Video plan contains unresolved items or validation errors requiring instructional review.'];
      setErrorMessage(`Plan Review Required: ${errs.join(' · ')}`);
      setModalState('error');
      return;
    }

    setModalState('generating');
    setErrorMessage(null);
    setElapsedSeconds(0);

    // Elapsed counter
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    try {
      const allClipsToProcess = (isMultiClip && videoPlan?.clips) 
        ? videoPlan.clips 
        : [{
            clip_index: 1,
            title: lesson.title,
            duration_seconds: 15,
            veo_prompt: promptText,
          }];

      const newUrls: Record<number, string> = { ...cachedUrls };

      for (let i = 0; i < allClipsToProcess.length; i++) {
        const clip = allClipsToProcess[i];
        setCurrentRenderingClip(clip.clip_index);

        if (allClipsToProcess.length > 1) {
          setGenerationStage(`Generating step ${clip.clip_index} of ${allClipsToProcess.length}: ${clip.title}`);
        } else {
          setGenerationStage(`Rendering instructional demonstration...`);
        }

        const p = clip.veo_prompt || promptText;
        const blob = await generateSingleClip(p, clip.clip_index);

        if (isMultiClip) {
          await saveClipBlob(lesson.id, clip.clip_index, blob);
        } else {
          await saveVideoBlob(lesson.id, blob);
        }

        const url = URL.createObjectURL(blob);
        newUrls[clip.clip_index] = url;
        setCachedUrls({ ...newUrls });
      }

      cleanupPolling();
      setActiveClipIndex(1);
      setModalState('player');
    } catch (err: any) {
      cleanupPolling();
      setErrorMessage(err.message || 'Could not complete video generation.');
      setModalState('error');
    }
  };

  // Auto-advance sequentially when current clip finishes playing
  const handleClipEnded = () => {
    if (isMultiClip && videoPlan?.clips) {
      if (activeClipIndex < videoPlan.clips.length) {
        const nextIndex = activeClipIndex + 1;
        if (cachedUrls[nextIndex]) {
          setActiveClipIndex(nextIndex);
        }
      }
    }
  };

  // Re-generate all clips from scratch (clears both server and local storage)
  const handleRegenerate = async () => {
    cleanupPolling();
    cleanupAllUrls();
    try {
      await fetch(`/api/videos/${encodeURIComponent(lesson.id)}`, { 
        method: 'DELETE',
        headers: getApiHeaders(),
      });
    } catch (_) {}
    await removeAllLessonClips(lesson.id, totalClips);
    setCachedUrls({});
    setModalState('prompt');
  };

  if (!isOpen) return null;

  const currentClipData: VideoClipPlan | undefined = isMultiClip && videoPlan?.clips 
    ? videoPlan.clips.find(c => c.clip_index === activeClipIndex)
    : undefined;

  const currentVideoSrc = cachedUrls[activeClipIndex] || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-[#0f1015] border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        
        {/* Top Header - Ultra-clean & unboxed */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-white/[0.08] bg-black/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
              <Film size={15} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                Show Me · Demonstration
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-white truncate">
                {lesson.title}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              cleanupPolling();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Main Stage - Maximum Space for Video */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col">

          {/* VIEW 1: PROMPT / PRE-GENERATION */}
          {modalState === 'prompt' && (
            <div className="flex-1 flex flex-col justify-between space-y-4">
              
              {/* Cinematic Preview Placeholder */}
              <div className="relative aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-b from-[#14161f] to-[#0c0d12] border border-white/10 flex flex-col items-center justify-center text-center p-6 shadow-inner">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/5">
                  <Play size={28} className="translate-x-0.5 fill-blue-400/20" />
                </div>
                
                <h3 className="text-base sm:text-lg font-semibold text-white max-w-lg mb-2">
                  AI Video Demonstration Ready
                </h3>
                
                <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed mb-5">
                  {isMultiClip
                    ? `Generates complete step-by-step video clips for this SOP. All clips render automatically and play in sequence.`
                    : 'Generates a high-definition video demonstration of a frontline worker performing the operational procedure.'}
                </p>

                {/* Subtle Step Outline (No messy boxes) */}
                {isMultiClip && videoPlan?.clips && (
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-zinc-400 font-medium max-w-lg">
                    {videoPlan.clips.map((clip, idx) => (
                      <React.Fragment key={clip.clip_index}>
                        <span className="text-zinc-300">
                          <span className="text-blue-400 font-semibold">{clip.clip_index}.</span> {clip.title}
                        </span>
                        {idx < videoPlan.clips.length - 1 && (
                          <span className="text-zinc-600" aria-hidden="true">·</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional Collapsed Prompt Customizer */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowPromptEditor(!showPromptEditor)}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-1"
                >
                  <Sliders size={13} className="text-blue-400" />
                  <span>Customize generation prompt</span>
                  {showPromptEditor ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {showPromptEditor && (
                  <div className="mt-2 space-y-2 animate-in fade-in duration-150">
                    <textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      rows={3}
                      className="w-full bg-[#14161f] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-all resize-none leading-relaxed"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => setPromptText(buildDefaultPrompt())}
                        className="text-[11px] text-zinc-500 hover:text-zinc-300 underline"
                      >
                        Reset to default prompt
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: CINEMATIC RENDERING (Clean, in-frame loader without 1-by-1 card clutter) */}
          {modalState === 'generating' && (
            <div className="flex-1 flex flex-col justify-center">
              <div className="relative aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-b from-[#12141c] to-[#0a0b10] border border-white/10 flex flex-col items-center justify-center text-center p-6 sm:p-10 shadow-2xl">
                
                {/* Ambient Soft Glow Behind Loader */}
                <div className="absolute w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

                {/* Elegant Animated Ring */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-5">
                  <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping opacity-30" />
                  <div className="absolute inset-1.5 rounded-full border border-blue-400/40 animate-pulse" />
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/20">
                    <Sparkles size={20} className="animate-spin duration-1000" />
                  </div>
                </div>

                <div className="space-y-1.5 max-w-md relative z-10">
                  <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    Generating SOP Demonstration Video
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                    {generationStage}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Synthesizing realistic visual demonstration using Google Veo.
                  </p>
                </div>

                {/* Sleek Minimal Progress Line */}
                <div className="w-full max-w-xs mt-6 space-y-2 relative z-10">
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-500"
                      style={{
                        width: isMultiClip 
                          ? `${Math.max(10, ((currentRenderingClip - 0.5) / totalClips) * 100)}%` 
                          : `${Math.min(95, Math.max(15, elapsedSeconds * 2))}%`
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {elapsedSeconds}s elapsed
                    </span>
                    {isMultiClip && (
                      <span>Step {currentRenderingClip} of {totalClips}</span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* VIEW 3: CLEAN PREMIUM PLAYER (Maximum Space, Minimal Text & Zero Clutter) */}
          {modalState === 'player' && (
            <div className="flex-1 flex flex-col space-y-3 sm:space-y-4">
              
              {/* Sequential Steps Navigation Bar (Clean unboxed tabs) */}
              {isMultiClip && videoPlan?.clips && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {videoPlan.clips.map((clip) => {
                    const isActive = clip.clip_index === activeClipIndex;
                    const isReady = Boolean(cachedUrls[clip.clip_index]);

                    return (
                      <button
                        key={clip.clip_index}
                        onClick={() => {
                          if (isReady) {
                            setActiveClipIndex(clip.clip_index);
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : isReady
                              ? 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                              : 'text-zinc-600 cursor-not-allowed'
                        }`}
                      >
                        <span className={`text-[11px] font-semibold ${isActive ? 'text-blue-100' : 'text-zinc-500'}`}>
                          {clip.clip_index}
                        </span>
                        <span className="truncate max-w-[140px] sm:max-w-none">{clip.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Main Full-Size Video Container */}
              <div className="relative aspect-video w-full bg-black rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
                {currentVideoSrc ? (
                  <video
                    ref={videoRef}
                    key={currentVideoSrc}
                    src={currentVideoSrc}
                    controls
                    autoPlay
                    playsInline
                    onEnded={handleClipEnded}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-zinc-500">Video unavailable</div>
                )}
              </div>

              {/* Quiet Step Headline & Instruction (Unboxed, clean typography) */}
              <div className="px-1 py-1">
                <div className="flex items-baseline gap-2">
                  <h4 className="text-sm font-semibold text-white">
                    {currentClipData?.title || lesson.title}
                  </h4>
                  {currentClipData?.step_ref && (
                    <span className="text-[11px] text-zinc-400">
                      ({currentClipData.step_ref})
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  {currentClipData?.key_action || lesson.description || 'Observe the demonstration carefully and replicate the operational technique.'}
                </p>
              </div>

            </div>
          )}

          {/* VIEW 4: ERROR */}
          {modalState === 'error' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3.5 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-1 shadow-inner">
                <Clock size={22} />
              </div>
              <div className="text-sm font-semibold text-white">
                {errorMessage?.includes('rate limit') || errorMessage?.includes('quota') || errorMessage?.includes('RESOURCE_EXHAUSTED')
                  ? 'Veo Rate Limit Reached'
                  : 'Generation Failed'}
              </div>
              <p className="text-xs text-zinc-400 max-w-md leading-relaxed px-4">
                {errorMessage || 'Unable to complete video generation.'}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setModalState('prompt')}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 sm:px-7 py-3.5 border-t border-white/[0.08] bg-black/20 flex items-center justify-between gap-3">
          {modalState === 'prompt' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartGeneration}
                disabled={videoPlan?.validation_status === 'invalid'}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm shadow-md transition-all ${
                  videoPlan?.validation_status === 'invalid'
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                    : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.01] active:scale-[0.99]'
                }`}
                title={videoPlan?.validation_status === 'invalid' ? 'Plan contains unresolved items requiring review before generation' : undefined}
              >
                <Sparkles size={15} />
                <span>{videoPlan?.validation_status === 'invalid' ? 'Review Required (Plan Invalid)' : 'Generate Video Demonstration'}</span>
              </button>
            </>
          )}

          {modalState === 'generating' && (
            <div className="w-full flex justify-end">
              <button
                onClick={() => {
                  cleanupPolling();
                  setModalState('prompt');
                }}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Cancel Generation
              </button>
            </div>
          )}

          {modalState === 'player' && (
            <div className="w-full flex items-center justify-between gap-3">
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <RotateCcw size={12} />
                <span>Regenerate</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Done
                </button>
                {onContinueToGuideMe && (
                  <button
                    onClick={() => {
                      onClose();
                      onContinueToGuideMe();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>Continue to Guide Me</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          )}

          {modalState === 'error' && (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
