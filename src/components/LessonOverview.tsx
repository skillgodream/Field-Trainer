import React, { useState } from 'react';
import { ChevronLeft, ArrowRight, BookOpen, Play, Bookmark, FileText, Compass, Award } from 'lucide-react';
import { Lesson } from '../types';
import { sounds } from '../utils/audio';

interface LessonOverviewProps {
  lesson: Lesson;
  onBack: () => void;
  onOpenIntroDeck: () => void;
  onStartSimulation: (phase: number) => void;
  onAskTrainer?: () => void;
}

export default function LessonOverview({
  lesson,
  onBack,
  onOpenIntroDeck,
  onStartSimulation,
  onAskTrainer,
}: LessonOverviewProps) {
  const [bookmarked, setBookmarked] = useState(false);

  // Dynamic color configuration based on lesson color scheme
  const getThemeColors = () => {
    switch (lesson.color) {
      case 'mint':
        return {
          bgClass: 'bg-[#ECFDF5]',
          blob1: 'bg-[#A7F3D0]',
          blob2: 'bg-[#6EE7B7]',
          blob3: 'bg-[#C6F6D5]',
          blob4: 'bg-[#A5F3FC]',
          textAccent: 'text-emerald-600',
          borderAccent: 'border-emerald-500/20',
          accentGradient: 'from-emerald-500/10 to-teal-500/10',
          primaryAccent: '#10B981',
        };
      case 'peach':
        return {
          bgClass: 'bg-[#FFF7ED]',
          blob1: 'bg-[#FFEDD5]',
          blob2: 'bg-[#FDBA74]',
          blob3: 'bg-[#FECACA]',
          blob4: 'bg-[#FED7AA]',
          textAccent: 'text-orange-600',
          borderAccent: 'border-orange-500/20',
          accentGradient: 'from-orange-500/10 to-amber-500/10',
          primaryAccent: '#F97316',
        };
      case 'lilac':
        return {
          bgClass: 'bg-[#F5F3FF]',
          blob1: 'bg-[#DDD6FE]',
          blob2: 'bg-[#C4B5FD]',
          blob3: 'bg-[#F5D0FE]',
          blob4: 'bg-[#E9D5FF]',
          textAccent: 'text-purple-600',
          borderAccent: 'border-purple-500/20',
          accentGradient: 'from-purple-500/10 to-indigo-500/10',
          primaryAccent: '#7C3AED',
        };
      case 'sky':
      default:
        return {
          bgClass: 'bg-[#E0F2FE]',
          blob1: 'bg-[#C7D2FE]',
          blob2: 'bg-[#D8B4FE]',
          blob3: 'bg-[#A5F3FC]',
          blob4: 'bg-[#FFD3C4]',
          textAccent: 'text-indigo-600',
          borderAccent: 'border-indigo-500/20',
          accentGradient: 'from-indigo-500/10 to-blue-500/10',
          primaryAccent: '#2563EB',
        };
    }
  };

  const themeColors = getThemeColors();

  const learningPath = [
    {
      id: 'know-it',
      title: 'Know It',
      modeTag: 'TEACHING FORMAT',
      desc: 'Explain the SOP & process in simple presentation format',
      duration: '2 min',
      bgColor: 'bg-white/60 border-white/70 hover:border-blue-300/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_36px_rgba(37,99,235,0.06)] hover:bg-white/85',
      iconBg: 'bg-blue-500/10 text-blue-600 border border-blue-200/20',
      pillTextColor: 'text-blue-600',
      arrowColor: 'text-blue-600',
      icon: BookOpen,
      action: () => onOpenIntroDeck(),
      illustration: (
        <div className="absolute right-0 bottom-0 overflow-hidden w-full h-full pointer-events-none">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/8 rounded-full blur-xl group-hover:bg-blue-500/15 transition-all duration-300" />
          <BookOpen size={72} strokeWidth={0.75} className="absolute -right-2 -bottom-2 text-blue-500/12 group-hover:text-blue-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300" />
        </div>
      )
    },
    {
      id: 'show-me',
      title: 'Show Me',
      modeTag: 'DEMONSTRATION',
      desc: 'Watch Coach demonstrate the actual SOP steps',
      duration: '3 min',
      bgColor: 'bg-white/60 border-white/70 hover:border-purple-300/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_36px_rgba(124,58,237,0.06)] hover:bg-white/85',
      iconBg: 'bg-purple-500/10 text-purple-600 border border-purple-200/20',
      pillTextColor: 'text-purple-600',
      arrowColor: 'text-purple-600',
      icon: Play,
      action: () => onStartSimulation(0),
      illustration: (
        <div className="absolute right-0 bottom-0 overflow-hidden w-full h-full pointer-events-none">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/8 rounded-full blur-xl group-hover:bg-purple-500/15 transition-all duration-300" />
          <Play size={72} strokeWidth={0.75} className="absolute -right-2 -bottom-2 text-purple-500/12 group-hover:text-purple-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300" />
        </div>
      )
    },
    {
      id: 'guide-me',
      title: 'Guide Me',
      modeTag: 'GUIDED PRACTICE',
      desc: 'Perform the SOP with step-by-step coach hints',
      duration: '5 min',
      bgColor: 'bg-white/60 border-white/70 hover:border-emerald-300/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_36px_rgba(16,185,129,0.06)] hover:bg-white/85',
      iconBg: 'bg-emerald-500/10 text-emerald-600 border border-emerald-200/20',
      pillTextColor: 'text-emerald-600',
      arrowColor: 'text-emerald-600',
      icon: Compass,
      action: () => onStartSimulation(1),
      illustration: (
        <div className="absolute right-0 bottom-0 overflow-hidden w-full h-full pointer-events-none">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/8 rounded-full blur-xl group-hover:bg-emerald-500/15 transition-all duration-300" />
          <Compass size={72} strokeWidth={0.75} className="absolute -right-2 -bottom-2 text-emerald-500/12 group-hover:text-emerald-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300" />
        </div>
      )
    },
    {
      id: 'test-me',
      title: 'Test Me',
      modeTag: 'ASSESSMENT',
      desc: 'Assess whether you can perform the SOP without hints',
      duration: '3 min',
      bgColor: 'bg-white/60 border-white/70 hover:border-orange-300/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_36px_rgba(249,115,22,0.06)] hover:bg-white/85',
      iconBg: 'bg-orange-500/10 text-orange-600 border border-orange-200/20',
      pillTextColor: 'text-orange-600',
      arrowColor: 'text-orange-600',
      icon: Award,
      action: () => onStartSimulation(2),
      illustration: (
        <div className="absolute right-0 bottom-0 overflow-hidden w-full h-full pointer-events-none">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-500/8 rounded-full blur-xl group-hover:bg-orange-500/15 transition-all duration-300" />
          <Award size={72} strokeWidth={0.75} className="absolute -right-2 -bottom-2 text-orange-500/12 group-hover:text-orange-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300" />
        </div>
      )
    },
  ];

  return (
    <div className={`fixed inset-0 z-40 ${themeColors.bgClass} flex flex-col overflow-y-auto animate-in fade-in duration-200 p-6 sm:p-8 font-sans`}>
      
      {/* 1. Fluid Pastel Holographic Backdrop Zones (No Apple logo, pure premium gradient mesh matching screenshot) */}
      <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none ${themeColors.bgClass}`}>
        {/* Soft Left-Top blob */}
        <div className={`absolute top-[-10%] left-[-10%] w-[85%] h-[60%] rounded-full ${themeColors.blob1} filter blur-[70px] opacity-90`} />
        
        {/* Pastel Right-Top blob */}
        <div className={`absolute top-[-5%] right-[-10%] w-[80%] h-[55%] rounded-full ${themeColors.blob2} filter blur-[80px] opacity-85`} />
        
        {/* Soft Mid-Left blob */}
        <div className={`absolute top-[40%] left-[-20%] w-[65%] h-[50%] rounded-full ${themeColors.blob3} filter blur-[70px] opacity-90`} />
        
        {/* Light Bottom blob */}
        <div className={`absolute bottom-[-10%] right-[-10%] w-[80%] h-[55%] rounded-full ${themeColors.blob4} filter blur-[85px] opacity-95`} />
        
        {/* Ultra-soft white overlay for fluid translucent look */}
        <div className="absolute inset-0 bg-white/25 backdrop-blur-[3px]" />
      </div>

      <div className="relative w-full flex flex-col z-10 max-w-md mx-auto">
        
        {/* 2. Header Navigation Bar */}
        <div className="flex justify-between items-center w-full relative z-10">
          <button
            onClick={() => {
              sounds.playTap();
              onBack();
            }}
            className="w-10 h-10 rounded-full border border-white/50 bg-white/40 flex items-center justify-center text-slate-800 shadow-xs hover:bg-white/60 active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft size={20} className="stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-2">
            {onAskTrainer && (
              <button
                onClick={() => {
                  sounds.playTap();
                  onAskTrainer();
                }}
                className="px-3.5 py-1.5 rounded-full bg-white/40 border border-white/50 text-xs font-bold text-slate-800 hover:bg-white/60 transition-all shadow-2xs cursor-pointer"
              >
                Ask Trainer
              </button>
            )}
            <button
              onClick={() => {
                sounds.playTap();
                setBookmarked(!bookmarked);
              }}
              className="w-10 h-10 rounded-full border flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer hover:bg-white/60"
              style={{
                backgroundColor: bookmarked ? themeColors.primaryAccent : 'rgba(255, 255, 255, 0.4)',
                borderColor: bookmarked ? themeColors.primaryAccent : 'rgba(255, 255, 255, 0.5)',
                color: bookmarked ? '#FFFFFF' : '#1E293B',
              }}
              aria-label="Bookmark"
            >
              <Bookmark size={18} className={bookmarked ? 'fill-current' : ''} />
            </button>
          </div>
        </div>

        {/* 3. Hero Header Section: Perfectly aligned grid layout with no overlaps */}
        <div className="flex items-center justify-between gap-4 pt-8 pb-6 border-b border-black/5 relative z-10">
          <div className="flex-1 space-y-2">
            {/* Steps Count Badge - Dynamic theme text color with book open icon */}
            <div className={`flex items-center gap-1.5 ${themeColors.textAccent} font-extrabold text-xs uppercase tracking-wider`}>
              <BookOpen size={14} className="stroke-[2.5]" />
              <span>{lesson.stepsCount} verified steps</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#0C111E] tracking-tight leading-tight">
              {lesson.title}
            </h1>

            <p className="text-slate-600 font-semibold text-xs sm:text-sm leading-relaxed max-w-xs">
              {lesson.description || 'Ensure a safe, welcoming environment for every guest.'}
            </p>
          </div>

          {/* Right-side Koala Coach circular profile - contained, properly scaled */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/40 border border-white/60 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
            <img
              src="/Coachguru.png"
              alt="Guruji Koala Coach"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain transform translate-y-2.5 scale-110 drop-shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/guruji 1.png";
              }}
            />
          </div>
        </div>

        {/* 4. Interactive 2x2 Format Options Grid (Apple light glass translucent cards) */}
        <div className="grid grid-cols-2 gap-4 pt-6 mt-2 relative z-10">
          {learningPath.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sounds.playTap();
                  item.action();
                }}
                className={`relative overflow-hidden h-[180px] rounded-3xl backdrop-blur-xl border ${item.bgColor} p-5 flex flex-col justify-between items-start text-left active:scale-[0.98] transition-all duration-300 cursor-pointer group`}
              >
                {/* Top Row: Mini Icon + White/Glass Circle Chevron Arrow */}
                <div className="flex justify-between items-center w-full">
                  <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/80 border border-white/60 flex items-center justify-center shadow-2xs group-hover:bg-white text-slate-800 transition-all duration-200">
                    <ArrowRight size={12} className="stroke-[2.5]" />
                  </div>
                </div>

                {/* Bottom Row: Text & Pill Badge */}
                <div className="mt-auto relative z-10">
                  <span className="text-base font-extrabold text-[#0C111E] block leading-tight">
                    {item.title}
                  </span>
                  <span className={`inline-block px-2.5 py-0.5 bg-white/80 border border-white/50 rounded-full text-[10px] font-bold tracking-wide mt-2 shadow-2xs ${item.pillTextColor}`}>
                    {item.duration}
                  </span>
                </div>

                {/* Custom Gorgeous Watermark outline at the bottom-right corner */}
                {item.illustration}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
