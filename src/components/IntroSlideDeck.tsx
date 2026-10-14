import React, { useState } from 'react';
import { X, Volume2, ArrowRight, ArrowLeft, Check, AlertCircle, HelpCircle, UserCheck, ShieldCheck, FileText } from 'lucide-react';
import ClayArt from './ClayArt';
import ToolDetailModal from './ToolDetailModal';
import { WAREHOUSE_TOOLS, STEP_JOURNEY } from '../data/lessonsData';
import { ToolItem, Lesson } from '../types';
import { sounds } from '../utils/audio';

interface IntroSlideDeckProps {
  lesson?: Lesson;
  onClose: () => void;
  onStartSimulation: () => void;
  onAskTrainer?: () => void;
}

export default function IntroSlideDeck({ lesson, onClose, onStartSimulation, onAskTrainer }: IntroSlideDeckProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);

  const totalSlides = 8;

  // Extract dynamic items if lesson is present
  const dynamicSteps = lesson?.blueprint?.scenarios.watch || [];
  const dynamicChecklist = lesson?.blueprint?.floor_checklist || [];
  const dynamicTools = lesson?.passport?.fields.tools || [];
  const dynamicRules = lesson?.passport?.fields.golden_rules || [];
  const dynamicMistakes = lesson?.blueprint?.common_mistakes || [];

  const handleNext = () => {
    sounds.playTap();
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onStartSimulation();
    }
  };

  const handlePrev = () => {
    sounds.playTap();
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleAudioSpeak = (text: string) => {
    sounds.playTap();
    sounds.speak(text);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F7F5] flex flex-col overflow-hidden">
      {/* Top App Header with Slide Progress and Ask Trainer */}
      <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-[#E6E8EC] bg-white/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-[#F7F7F5] border border-[#E6E8EC] flex items-center justify-center text-[#0E1116] hover:bg-[#E6E8EC] active:scale-95 transition-all cursor-pointer"
            aria-label="Exit Intro"
          >
            <X size={20} />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D4652]">KNOW IT</span>
            <div className="text-xs font-bold text-[#0E1116]">
              Slide {currentSlide + 1} of {totalSlides}
            </div>
          </div>
        </div>

        {/* Source Filename Pill if Present */}


        {/* Slide Dots & Ask Trainer */}
        <div className="flex items-center gap-3">
          {onAskTrainer && (
            <button
              onClick={() => {
                sounds.playTap();
                onAskTrainer();
              }}
              className="text-[10px] font-bold text-[#14532D] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer"
            >
              <UserCheck size={12} className="text-emerald-600" />
              <span>Trainer</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'w-5 bg-[#0E1116]' : 'w-2 bg-[#E6E8EC]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Slide Content: Split Screen */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* SLIDE 1: What is this SOP? */}
        {currentSlide === 0 && (
          <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
            <div className="h-[44%] bg-[#DCEBFF] relative flex items-center justify-center p-6">
              <button
                onClick={() =>
                  handleAudioSpeak(
                    `What is ${lesson?.title || 'this SOP'}? ${lesson?.description || 'Standard Operating Procedure'}`
                  )
                }
                className="absolute top-4 right-4 w-12 h-12 rounded-full bg-[#0E1116] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer"
                aria-label="Listen"
              >
                <Volume2 size={22} />
              </button>
              <div className="w-36 h-36 rounded-full bg-white/40 absolute" />
              <ClayArt type={lesson?.artType || 'clipboard'} size={135} />
            </div>

            <div className="flex-1 bg-white rounded-t-[32px] -mt-6 p-6 shadow-[0_8px_24px_rgba(16,24,40,.08)] flex flex-col justify-between overflow-y-auto z-10">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#2F6FED] bg-[#DCEBFF] px-3 py-1 rounded-full mb-2">
                  {lesson?.category || 'SOP Foundation'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0E1116] leading-tight mb-2">
                  {lesson ? `What is ${lesson.title}?` : 'What is Picking?'}
                </h1>
                <p className="text-base font-semibold text-[#3D4652] leading-relaxed mb-3">
                  {lesson?.description || 'Standard Operating Procedure guideline for frontline execution.'}
                </p>

                {lesson?.sourceMeta && (
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-900 mb-3">
                    <p>Source: {lesson.sourceMeta.filename} · Version: {lesson.sourceMeta.version}</p>
                    <p className="text-[11px] font-normal text-emerald-700 mt-0.5">{lesson.sourceMeta.confirmationText}</p>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button
                  onClick={handleNext}
                  className="w-full h-14 rounded-full bg-[#0E1116] text-white text-lg font-bold flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-lg cursor-pointer"
                >
                  Next: The Job <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2: Interactive Visual Flowchart */}
        {currentSlide === 1 && (
          <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
            <div className="h-[28%] bg-[#DDF3E6] relative flex items-center justify-center p-4">
              <button
                onClick={() => handleAudioSpeak('Process Flowchart')}
                className="absolute top-3 right-4 w-10 h-10 rounded-full bg-[#0E1116] text-white flex items-center justify-center cursor-pointer shadow-sm"
              >
                <Volume2 size={18} />
              </button>
              <ClayArt type="clipboard" size={90} />
            </div>

            <div className="flex-1 bg-white rounded-t-[32px] -mt-5 p-6 shadow-sm flex flex-col justify-between overflow-y-auto z-10">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h1 className="text-xl font-bold text-[#0E1116]">Process Flowchart</h1>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {dynamicSteps.length || 5} Core Phase Steps
                  </span>
                </div>
                <p className="text-xs text-[#66726B] font-semibold mb-3">
                  Sequential workflow in operational execution order
                </p>

                {/* Node-and-Arrow Visual Flowchart */}
                <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
                  {(dynamicSteps.length > 0 ? dynamicSteps : [
                    { title: 'Verify live order ID on handheld before greeting customer', why: 'Ensures correct record match before taking physical item' },
                    { title: 'Inspect item condition, physical seals & packaging', why: 'Detects damaged or tampered goods immediately' },
                    { title: 'Evaluate eligibility & decide Accept / Reject status', why: 'Applies written SOP decision rules strictly' },
                    { title: 'Communicate decision & process disposition', why: 'Keeps customer informed with standard wording' },
                  ]).map((stepItem: any, idx: number, arr: any[]) => (
                    <div key={idx} className="relative">
                      <div className="p-3.5 rounded-2xl bg-[#F7F7F5] border border-[#E6E8EC] hover:border-[#1FA55E] transition-all relative z-10">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-[#0E1116] text-white flex items-center justify-center text-xs font-black shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xs font-bold text-[#0E1116] leading-tight">
                              {stepItem.title || stepItem.question || `Step ${idx + 1}`}
                            </h3>
                            {(stepItem.why || stepItem.desc) && (
                              <p className="text-[11px] font-semibold text-[#66726B] mt-1">
                                {stepItem.why || stepItem.desc}
                              </p>
                            )}
                            {stepItem.sub_cues && stepItem.sub_cues.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-[#E6E8EC] space-y-1">
                                {stepItem.sub_cues.map((cue: string, cIdx: number) => (
                                  <div key={cIdx} className="flex items-center gap-1.5 text-[11px] text-[#3D4652]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1FA55E] shrink-0" />
                                    <span className="truncate">{cue}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {idx < arr.length - 1 && (
                        <div className="flex justify-center my-0.5">
                          <div className="w-0.5 h-3 bg-[#1FA55E]/40" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  onClick={handlePrev}
                  className="w-14 h-14 rounded-full border border-[#E6E8EC] bg-white flex items-center justify-center text-[#0E1116] cursor-pointer"
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 h-14 rounded-full bg-[#0E1116] text-white text-lg font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  Step Journey <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3: Interactive Step Journey */}
        {currentSlide === 2 && (
          <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
            <div className="h-[28%] bg-[#FFE6D2] relative flex items-center justify-center p-4">
              <button
                onClick={() => handleAudioSpeak('Interactive Step Journey')}
                className="absolute top-3 right-4 w-10 h-10 rounded-full bg-[#0E1116] text-white flex items-center justify-center cursor-pointer"
              >
                <Volume2 size={18} />
              </button>
              <ClayArt type="clipboard" size={90} />
            </div>

            <div className="flex-1 bg-white rounded-t-[32px] -mt-5 p-6 shadow-sm flex flex-col justify-between overflow-y-auto z-10">
              <div>
                <h1 className="text-xl font-bold text-[#0E1116] mb-1">Interactive Step Journey</h1>
                <p className="text-xs text-[#66726B] font-semibold mb-3">Extracted procedure sequence</p>
                <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                  {(dynamicSteps.length > 0
                    ? dynamicSteps.map((s, idx) => ({
                        step: idx + 1,
                        name: s.title,
                        desc: s.why || s.question,
                        icon: '📋',
                        isException: idx === 0,
                      }))
                    : STEP_JOURNEY
                  ).map((s) => (
                    <div
                      key={s.step}
                      className={`p-3 rounded-2xl border transition-all ${
                        s.isException
                          ? 'bg-[#FFE6D2]/60 border-[#F27A1A]/40 text-[#9A3412]'
                          : 'bg-[#F7F7F5] border-[#E6E8EC] text-[#0E1116]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <span className="text-base">{s.icon}</span>
                          <span>
                            {s.step}. {s.name}
                          </span>
                        </div>
                        {s.isException && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#F27A1A] text-white">
                            Key Rule
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold mt-1 opacity-85">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  onClick={handlePrev}
                  className="w-14 h-14 rounded-full border border-[#E6E8EC] bg-white flex items-center justify-center text-[#0E1116] cursor-pointer"
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 h-14 rounded-full bg-[#0E1116] text-white text-lg font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  Next: Your Tools <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 4: Tools & Equipment */}
        {currentSlide === 3 && (
          <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
            <div className="h-[28%] bg-[#FFE6D2] relative flex items-center justify-center p-4">
              <button
                onClick={() => handleAudioSpeak('Tools and Equipment')}
                className="absolute top-3 right-4 w-10 h-10 rounded-full bg-[#0E1116] text-white flex items-center justify-center cursor-pointer"
              >
                <Volume2 size={18} />
              </button>
              <ClayArt type="box" size={90} />
            </div>

            <div className="flex-1 bg-white rounded-t-[32px] -mt-5 p-6 shadow-sm flex flex-col justify-between overflow-y-auto z-10">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h1 className="text-xl font-bold text-[#0E1116]">Process Tools & Guideline</h1>
                  <span className="text-xs font-bold text-[#F27A1A] bg-[#FFE6D2] px-3 py-1 rounded-full">
                    SOP Requirements
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 max-h-[46vh] overflow-y-auto">
                  {(dynamicTools.length > 0
                    ? dynamicTools.map((t, idx) => ({
                        id: `t_${idx}`,
                        name: t.name,
                        shortDesc: t.purpose,
                        whatItIs: t.what_it_is,
                        whatItsFor: t.purpose,
                        neverDo: t.never_do,
                        iconName: 'clipboard',
                      }))
                    : WAREHOUSE_TOOLS
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        sounds.playTap();
                        setSelectedTool(t);
                      }}
                      className="p-3 bg-[#F7F7F5] border border-[#E6E8EC] rounded-2xl text-left hover:border-[#0E1116] active:scale-98 transition-all cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-2">
                        <ClayArt type="clipboard" size={24} />
                      </div>
                      <span className="text-xs font-bold text-[#0E1116] block">{t.name}</span>
                      <span className="text-[10px] text-[#66726B] font-semibold block truncate">
                        {t.shortDesc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  onClick={handlePrev}
                  className="w-14 h-14 rounded-full border border-[#E6E8EC] bg-white flex items-center justify-center text-[#0E1116] cursor-pointer"
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 h-14 rounded-full bg-[#0E1116] text-white text-lg font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  Golden Rules <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 5: Golden Rules & Side-by-Side Pass vs Fail Inspection Contrast */}
        {currentSlide === 4 && (
          <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
            <div className="h-[24%] bg-[#E8E1FF] relative flex items-center justify-center p-4">
              <button
                onClick={() => handleAudioSpeak('Golden Rules and Inspection Pass Fail Criteria')}
                className="absolute top-3 right-4 w-10 h-10 rounded-full bg-[#0E1116] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer"
              >
                <Volume2 size={18} />
              </button>
              <ClayArt type="medal" size={85} />
            </div>

            <div className="flex-1 bg-white rounded-t-[32px] -mt-5 p-6 shadow-sm flex flex-col justify-between overflow-y-auto z-10">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h1 className="text-xl font-bold text-[#0E1116]">Inspection & Decision Rules</h1>
                  <span className="text-[10px] font-bold text-purple-900 bg-purple-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Pass vs Fail
                  </span>
                </div>

                {/* Side-by-Side Pass / Accept vs Fail / Reject Panel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[46vh] overflow-y-auto mb-2">
                  {/* ACCEPT / PASS PANEL */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-emerald-200">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        ✓
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wide text-emerald-900">
                        Accept / Pass Conditions
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-emerald-950 font-medium">
                      {(dynamicRules.length > 0
                        ? dynamicRules.map((r) => r.text)
                        : [
                            'Verify active order on handheld before greeting customer',
                            'Inspect item condition, physical seal & label integrity',
                            'Match exact SKU digits and serial identifiers',
                            'Record transaction in app upon successful verification',
                          ]
                      ).map((ruleText, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold mt-0.5">•</span>
                          <span>{ruleText}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* REJECT / FAIL PANEL */}
                  <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200">
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-rose-200">
                      <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        ✕
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wide text-rose-900">
                        Reject / Prohibited Actions
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-rose-950 font-medium">
                      {(dynamicMistakes.length > 0
                        ? dynamicMistakes
                        : [
                            'Never improvise custom exception rules or skip verification',
                            'Do not accept unlisted items without order verification',
                            'Never guarantee refund timeline verbally to customer',
                            'Do not override system warnings without supervisor sign-off',
                          ]
                      ).map((mistakeText, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-600 font-bold mt-0.5">•</span>
                          <span>{mistakeText}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* PAUSE & ESCALATE AMBER CALLOUT */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2 text-xs font-bold text-amber-900">
                  <span className="text-amber-600 text-sm">⚠️</span>
                  <span>When encountering missing SOP instructions or disputed conditions: PAUSE & ESCALATE.</span>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  onClick={handlePrev}
                  className="w-14 h-14 rounded-full border border-[#E6E8EC] bg-white flex items-center justify-center text-[#0E1116] cursor-pointer"
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 h-14 rounded-full bg-[#0E1116] text-white text-lg font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  What Can Go Wrong <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 6: What Can Go Wrong */}
        {currentSlide === 5 && (
          <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
            <div className="h-[40%] bg-[#FBE0EA] relative flex items-center justify-center p-6">
              <button
                onClick={() => handleAudioSpeak('What can go wrong? Stop. Check. Act correctly.')}
                className="absolute top-4 right-4 w-12 h-12 rounded-full bg-[#0E1116] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer"
              >
                <Volume2 size={22} />
              </button>
              <ClayArt type="safety" size={130} />
            </div>

            <div className="flex-1 bg-white rounded-t-[32px] -mt-6 p-6 shadow-sm flex flex-col justify-between overflow-y-auto z-10">
              <div>
                <h1 className="text-2xl font-bold text-[#0E1116] mb-3">What Can Go Wrong?</h1>
                <div className="space-y-2 mb-4">
                  {(dynamicMistakes.length > 0
                    ? dynamicMistakes
                    : [
                        'Skipping verification steps without checking procedure',
                        'Guessing without consulting written SOP',
                        'Deviating from approved operational standard',
                      ]
                  ).map((mistake, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[#FBE0EA]/60 border border-[#FBE0EA] flex items-center gap-2.5 text-xs font-bold text-[#991B1B]"
                    >
                      <AlertCircle size={18} className="text-[#E5484D] shrink-0" />
                      <span>{mistake}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 bg-[#E5484D] text-white rounded-2xl text-center font-bold text-sm shadow-md">
                  Don't guess. Stop. Check. Act correctly.
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={handlePrev}
                  className="w-14 h-14 rounded-full border border-[#E6E8EC] bg-white flex items-center justify-center text-[#0E1116] cursor-pointer"
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 h-14 rounded-full bg-[#0E1116] text-white text-lg font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  Meet Guruji <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 7: Meet Guruji */}
        {currentSlide === 6 && (
          <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
            <div className="h-[40%] bg-[#FFF2C9] relative flex items-center justify-center p-6">
              <button
                onClick={() =>
                  handleAudioSpeak(
                    `Meet Guruji, your operational work coach for ${lesson?.title || 'this SOP'}.`
                  )
                }
                className="absolute top-4 right-4 w-12 h-12 rounded-full bg-[#0E1116] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer"
              >
                <Volume2 size={22} />
              </button>
              <ClayArt type="guru" size={135} />
            </div>

            <div className="flex-1 bg-white rounded-t-[32px] -mt-6 p-6 shadow-sm flex flex-col justify-between overflow-y-auto z-10">
              <div>
                <h1 className="text-2xl font-bold text-[#0E1116] mb-2">Meet Guruji Coach</h1>
                <div className="p-4 rounded-2xl bg-[#FFF2C9]/60 border border-[#FFF2C9] text-sm font-semibold text-[#854D0E] mb-4 leading-relaxed">
                  "I'm with you on the floor. If you ever hesitate, tap 'Show me' or ask for a hint. We execute safely together!"
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      sounds.playTap();
                      sounds.speak(`Hint for ${lesson?.title || 'this step'}: Check your written SOP checklist.`);
                    }}
                    className="p-3 rounded-2xl border border-[#E6E8EC] bg-[#F7F7F5] font-bold text-xs text-[#0E1116] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <HelpCircle size={16} className="text-[#2F6FED]" />
                    See a hint
                  </button>
                  <button
                    onClick={() => {
                      sounds.playTap();
                      sounds.speak('Calling trainer supervisor to station.');
                    }}
                    className="p-3 rounded-2xl border border-[#E6E8EC] bg-[#F7F7F5] font-bold text-xs text-[#0E1116] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <UserCheck size={16} className="text-[#1FA55E]" />
                    Ask trainer
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={handlePrev}
                  className="w-14 h-14 rounded-full border border-[#E6E8EC] bg-white flex items-center justify-center text-[#0E1116] cursor-pointer"
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 h-14 rounded-full bg-[#0E1116] text-white text-lg font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  Ready to Practice <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 8: Now You Do It */}
        {currentSlide === 7 && (
          <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
            <div className="h-[44%] bg-[#DCEBFF] relative flex items-center justify-center p-6">
              <button
                onClick={() => handleAudioSpeak('Now you do it! Start the interactive simulation.')}
                className="absolute top-4 right-4 w-12 h-12 rounded-full bg-[#0E1116] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer"
              >
                <Volume2 size={22} />
              </button>
              <ClayArt type="clipboard" size={135} />
            </div>

            <div className="flex-1 bg-white rounded-t-[32px] -mt-6 p-6 shadow-sm flex flex-col justify-between overflow-y-auto z-10">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#F27A1A] bg-[#FFE6D2] px-3 py-1 rounded-full mb-2">
                  Interactive Practice
                </span>
                <h1 className="text-3xl font-bold text-[#0E1116] leading-tight mb-2">
                  Now You Do It.
                </h1>
                <p className="text-base font-semibold text-[#3D4652] leading-relaxed mb-4">
                  Practice the operational steps for {lesson?.title || 'this SOP'} with live feedback from Guruji.
                </p>

                <div className="p-3 bg-[#F7F7F5] rounded-2xl border border-[#E6E8EC] flex justify-around text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#66726B] block">Steps</span>
                    <span className="text-lg font-bold text-[#0E1116]">{lesson?.stepsCount || 5}</span>
                  </div>
                  <div className="w-px bg-[#E6E8EC]" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#66726B] block">Target</span>
                    <span className="text-lg font-bold text-[#1FA55E]">100%</span>
                  </div>
                  <div className="w-px bg-[#E6E8EC]" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#66726B] block">Mode</span>
                    <span className="text-lg font-bold text-[#2F6FED]">Coach</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={handlePrev}
                  className="w-14 h-14 rounded-full border border-[#E6E8EC] bg-white flex items-center justify-center text-[#0E1116] cursor-pointer"
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  onClick={() => {
                    sounds.playTap();
                    onStartSimulation();
                  }}
                  className="flex-1 h-14 rounded-full bg-[#0E1116] hover:bg-black text-white text-base font-bold flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-lg cursor-pointer"
                >
                  I'm Ready → Show Me <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ToolDetailModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
    </div>
  );
}
