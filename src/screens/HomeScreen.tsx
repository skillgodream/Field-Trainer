import React from 'react';
import { Camera, Upload, Sparkles, BookOpen, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { Lesson } from '../types';
import { sounds } from '../utils/audio';
const gurujiImg = "/Coachguru.png";

interface HomeScreenProps {
  lessons: Lesson[];
  onScanClick: () => void;
  onUploadClick: () => void;
  onSelectSop: (lessonId: string, title?: string) => void;
  onExploreLibrary: () => void;
  onOpenPassport: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  lessons,
  onScanClick,
  onUploadClick,
  onSelectSop,
  onExploreLibrary,
  onOpenPassport,
}) => {
  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-28 space-y-5 max-w-lg mx-auto w-full animate-in fade-in duration-200">
      {/* 1. Guruji Header Hero Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0F1226] via-[#181B38] to-[#2B2354] p-6 text-white shadow-xl border border-indigo-500/20">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative w-20 h-20 shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-purple-500 animate-pulse opacity-40 blur-sm" />
            <img
              src="/Coachguru.png"
              alt="Guruji AI Coach"
              className="w-full h-full object-contain relative z-10 drop-shadow-md"
              onError={(e) => {
                // Fallback to gurujiImg if Coachguru.png is unavailable
                (e.target as HTMLImageElement).src = gurujiImg || "/guruji 1.png";
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold text-emerald-300 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Guruji Active & Ready
            </div>
            <h1 className="text-xl font-black text-white tracking-tight leading-tight">
              Workplace SOP Intelligence
            </h1>
            <p className="text-xs text-indigo-200/80 font-normal mt-0.5 leading-snug">
              Transform any SOP document into interactive drills.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Primary SOP Ingestion Actions (2 Prominent Cards) */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Create Lesson from Document
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Scan SOP Button */}
          <button
            onClick={() => {
              sounds.playTap();
              onScanClick();
            }}
            className="group relative flex flex-col items-start p-4 bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-900 shadow-sm active:scale-98 transition-all text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
              <Camera size={20} />
            </div>
            <span className="text-sm font-bold text-slate-900 leading-tight">
              Scan SOP
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5">
              Camera / OCR Text
            </span>
          </button>

          {/* Upload SOP File Button */}
          <button
            onClick={() => {
              sounds.playTap();
              onUploadClick();
            }}
            className="group relative flex flex-col items-start p-4 bg-indigo-600 text-white rounded-2xl border-2 border-indigo-700 shadow-md hover:bg-indigo-700 active:scale-98 transition-all text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center mb-3 backdrop-blur-sm group-hover:scale-105 transition-transform">
              <Upload size={20} />
            </div>
            <span className="text-sm font-bold text-white leading-tight">
              Upload SOP
            </span>
            <span className="text-[11px] text-indigo-100 font-medium mt-0.5">
              PDF, Word, Text
            </span>
          </button>
        </div>
      </div>

      {/* 3. Verified Domain SOPs List */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Verified Domain SOPs
          </h2>
          <button
            onClick={() => {
              sounds.playTap();
              onExploreLibrary();
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight size={12} />
          </button>
        </div>

        <div className="space-y-2.5">
          {lessons.slice(0, 4).map((lesson) => (
            <div
              key={lesson.id}
              onClick={() => {
                sounds.playTap();
                onSelectSop(lesson.id, lesson.title);
              }}
              className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-400 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {lesson.category}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {lesson.stepsCount || 6} Steps
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                    {lesson.title}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.2">
                    {lesson.subtitle || lesson.description}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-all ml-2">
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Process Passport Review Banner */}
      <div
        onClick={() => {
          sounds.playTap();
          onOpenPassport();
        }}
        className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 flex items-center justify-between cursor-pointer hover:border-amber-300 transition-all shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Process Passport Audit</h4>
            <p className="text-[11px] text-slate-600">Review operational controls & safety rules</p>
          </div>
        </div>
        <span className="text-xs font-bold text-amber-700 underline">Review</span>
      </div>
    </div>
  );
};
