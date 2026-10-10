import React from 'react';
import { Award, CheckCircle2, TrendingUp, Zap, RotateCcw } from 'lucide-react';
import { Lesson } from '../types';
import ClayArt from './ClayArt';
import { sounds } from '../utils/audio';

interface ProgressViewProps {
  lessons: Lesson[];
  onStartSimulation: (lessonId: string) => void;
}

export default function ProgressView({ lessons, onStartSimulation }: ProgressViewProps) {
  const avgMastery = Math.round(
    lessons.reduce((acc, curr) => acc + curr.masteryPercentage, 0) / lessons.length
  );

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-6 pt-4 pb-28 space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-[#0E1116] tracking-tight">Your Progress</h1>
        <p className="text-sm font-semibold text-[#66726B] mt-1">
          Mastery metrics & floor readiness evaluation
        </p>
      </div>

      {/* Hero Readiness Card */}
      <div className="bg-gradient-to-br from-[#10243A] to-[#1E3A5F] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            FLOOR READY
          </span>
          <span className="text-xs font-bold text-slate-300">Level 2 Certified</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="#334155" strokeWidth="8" fill="transparent" />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="#10B981"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 - (avgMastery / 100) * 2 * Math.PI * 40}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black">{avgMastery}%</span>
              <span className="text-[9px] uppercase font-bold text-slate-400">Mastery</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold leading-tight">Warehouse Floor Qualification</h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              3 of 4 core modules mastered with high accuracy. Ready for active shift picking.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playTap();
            onStartSimulation('picking-101');
          }}
          className="w-full h-12 rounded-2xl bg-white text-[#10243A] font-bold text-sm mt-5 flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-98 transition-all shadow-md"
        >
          <RotateCcw size={16} /> Run Shift Readiness Drill
        </button>
      </div>

      {/* Module Breakdown List */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#66726B] mb-3">
          Module Competency Breakdown
        </h3>
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="p-4 bg-white rounded-2xl border border-[#E6E8EC] shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{
                    backgroundColor:
                      lesson.color === 'sky'
                        ? '#DCEBFF'
                        : lesson.color === 'mint'
                        ? '#DDF3E6'
                        : lesson.color === 'peach'
                        ? '#FFE6D2'
                        : '#E8E1FF',
                  }}
                >
                  <ClayArt type={lesson.artType} size={30} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0E1116]">{lesson.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold text-[#66726B]">
                      {lesson.stepsCount} steps
                    </span>
                    <span className="text-xs text-[#E6E8EC]">·</span>
                    <span className="text-xs font-semibold text-[#1FA55E]">
                      {lesson.masteryPercentage}% mastery
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  sounds.playTap();
                  onStartSimulation(lesson.id);
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#F7F7F5] border border-[#E6E8EC] text-xs font-bold text-[#0E1116] hover:border-[#0E1116] active:scale-95 transition-all"
              >
                Practice
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Badges Earned */}
      <div className="bg-[#FFF2C9]/60 border border-[#FFF2C9] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Award size={18} className="text-[#D97706]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#92400E]">
            Earned Badges
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-bold text-[#854D0E]">
          <div className="p-2 rounded-xl bg-white/70 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>Zero Short Error</span>
          </div>
          <div className="p-2 rounded-xl bg-white/70 flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            <span>Sub-2min Pick Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
