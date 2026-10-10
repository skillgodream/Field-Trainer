import React, { useState } from 'react';
import { Slide } from '../types';
import { findBestVisualMatch } from '../../utils/visualLibraryMatcher';

export const SectionIntroPage: React.FC<{
  slide: Slide;
  onNext?: () => void;
}> = ({ slide }) => {
  const sec = slide.sec || 'PREPARE • Prerequisites';

  // Process slide fl items dynamically from extracted SOP
  const rawItems: string[] = slide.fl || [
    'Gloves on: Ensure clean heavy-duty nitrile safety gloves are fully equipped',
    'Sanitizer diluted 1:10: Measure and dilute solution correctly without guessing',
    'Workspace cleared: Keep table surfaces tidy and free of personal belongings',
  ];

  const fallbackImages = [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=300&q=80',
  ];

  const items = rawItems.map((raw, idx) => {
    const parts = raw.split(/(?<!\d)[:\-\–](?!\d)\s*/);
    let title = '';
    let subtitle = '';

    if (parts.length > 1 && parts[0].trim().length < 50) {
      title = parts[0]?.trim();
      subtitle = parts.slice(1).join(' ').trim();
    } else {
      const words = raw.trim().split(/\s+/);
      if (words.length > 6) {
        title = words.slice(0, 5).join(' ');
        subtitle = words.slice(5).join(' ');
      } else {
        title = raw.trim();
        subtitle = 'Mandatory SOP prerequisite verification before starting execution.';
      }
    }

    // Format title and subtitle cleanly
    title = title.charAt(0).toUpperCase() + title.slice(1);
    subtitle = subtitle.charAt(0).toUpperCase() + subtitle.slice(1);

    // Run custom dynamic visual match on this specific item text for high-fidelity thumbnails
    const itemMatch = findBestVisualMatch(raw, slide.title || '');
    const itemImg = itemMatch.url || fallbackImages[idx % fallbackImages.length];

    return {
      title,
      subtitle,
      img: itemImg,
    };
  });

  // Track checked states for tapping each card
  const [checkedStates, setCheckedStates] = useState<Record<number, boolean>>({});

  const toggleCheck = (idx: number) => {
    setCheckedStates((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const checkedCount = Object.values(checkedStates).filter(Boolean).length;

  // Custom high-fidelity outline illustrations matching Screenshot 3
  const renderOutlineIllustration = (index: number) => {
    // Card 1: Glove/Hand Outline Illustration
    if (index === 0) {
      return (
        <svg viewBox="0 0 120 120" className="absolute -right-2 -bottom-6 w-32 h-32 opacity-[0.16] text-white pointer-events-none select-none z-0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M50 110 C50 95 40 90 32 82 C24 74 24 64 32 58 C38 54 44 58 48 64 C48 55 48 35 52 26 C55 18 63 18 66 26 L68 55 C68 45 70 30 74 22 C77 15 84 15 87 22 L89 55 C89 45 92 32 96 26 C99 20 106 20 109 26 L111 60 C111 50 115 42 119 46 C123 50 121 65 119 75 C115 90 105 105 85 110" />
        </svg>
      );
    }
    // Card 2: Bottle Outline Illustration
    if (index === 1) {
      return (
        <svg viewBox="0 0 100 120" className="absolute right-2 -bottom-5 w-24 h-32 opacity-[0.16] text-white pointer-events-none select-none z-0" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M40 25 L40 15 H60 L60 25 L75 40 V110 H25 V40 Z" />
          <line x1="25" y1="75" x2="75" y2="75" />
          <line x1="45" y1="15" x2="45" y2="25" strokeWidth="2.5" />
          <line x1="55" y1="15" x2="55" y2="25" strokeWidth="2.5" />
        </svg>
      );
    }
    // Card 3+: Clean gear/cogs illustration
    return (
      <svg viewBox="0 0 100 100" className="absolute right-1 -bottom-1 w-24 h-24 opacity-[0.16] text-white pointer-events-none select-none z-0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="50" cy="50" r="16" />
        <path d="M50 15 V25 M50 75 V85 M15 50 H25 M75 50 H85 M25 25 L32 32 M68 68 L75 75 M75 25 L68 32 M32 68 L25 75" />
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Gradient Maroon/Orange Header Card matching Screenshot 3 perfectly */}
      <div className="bg-gradient-to-br from-[#5c0e21] via-[#881337] to-[#d9531e] rounded-3xl p-6 text-white relative overflow-hidden shadow-lg flex items-center justify-between min-h-[190px]">
        {/* Subtle translucent curve lines */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />
        <div className="absolute -left-5 -bottom-5 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

        <div className="space-y-3 z-10 max-w-[65%] text-left">
          {/* Prerequisites transparent badge with custom inline shield icon - explicitly white text/stroke */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold tracking-wide backdrop-blur-sm text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3.5 h-3.5 text-white inline shrink-0">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-white">Prerequisites & Preparation</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-white">
            Critical checks before you proceed
          </h2>

          <p className="text-xs sm:text-sm font-semibold text-rose-100/95 leading-snug">
            {slide.content || 'Get your tools and supplies ready for a safe and effective clean.'}
          </p>
        </div>

        {/* Circular Progress Ring on the Right Side */}
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0 z-10 mr-1">
          {/* Translucent background ring */}
          <svg className="absolute w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="30"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="5.5"
              fill="none"
            />
            {/* White progress stroke */}
            <circle
              cx="40"
              cy="40"
              r="30"
              stroke="#ffffff"
              strokeWidth="5.5"
              fill="none"
              strokeDasharray={2 * Math.PI * 30}
              strokeDashoffset={2 * Math.PI * 30 * (1 - (items.length ? checkedCount / items.length : 0))}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div className="text-center leading-none z-10">
            <div className="text-lg font-black text-white">{checkedCount}/{items.length}</div>
            <div className="text-[9px] font-black text-white/80 tracking-widest uppercase mt-0.5">ready</div>
          </div>
        </div>
      </div>

      {/* 2. Counter label exactly matching screenshot */}
      <div className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 mt-2.5">
        TAP EACH ONE AS YOU CHECK IT
      </div>

      {/* 3. High-fidelity dynamic list items with cover images, maroon tinted overlays, & custom line outlines */}
      <div className="space-y-3">
        {items.map((item, idx) => {
          const isChecked = checkedStates[idx];

          return (
            <div
              key={idx}
              onClick={() => toggleCheck(idx)}
              className="relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-slate-100 transition-all duration-300 cursor-pointer h-36 flex items-end p-5 select-none"
            >
              {/* Cover Background Image */}
              <img
                src={item.img}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                referrerPolicy="no-referrer"
              />

              {/* Ultra-deep translucent dark wine/black overlay to guarantee excellent legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#120106]/95 via-[#180209]/85 to-[#2c040d]/15" />

              {/* Screenshot 3 Custom Outline Illustration overlaying on the right */}
              {renderOutlineIllustration(idx)}

              {/* Checked Indicator Ring in the Top Right of card */}
              <div className="absolute top-4 right-4 z-10">
                {isChecked ? (
                  /* Filled Green Check badge */
                  <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-md transition-all scale-110">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" className="w-3.5 h-3.5 text-white">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                ) : (
                  /* Translucent empty circular ring */
                  <div className="w-7 h-7 rounded-full border-2 border-white/70 backdrop-blur-2xs hover:border-white transition-colors" />
                )}
              </div>

              {/* Title & Subtitle in the bottom-left with crisp soft text-shadow overlay */}
              <div className="relative z-10 space-y-0.5 text-left pr-10">
                <h3 
                  className="text-lg font-black text-white leading-tight"
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,0.8)' }}
                >
                  {item.title}
                </h3>
                <p 
                  className="text-xs font-bold text-rose-100 leading-snug"
                  style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.7)' }}
                >
                  {item.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
