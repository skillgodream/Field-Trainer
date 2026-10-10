import React from 'react';
import ClayArt from './ClayArt';

interface LessonCardProps {
  title: string;
  subtitle: string;
  color: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  artType?: 'scanner' | 'box' | 'tote' | 'safety' | 'clipboard' | 'trolley';
  progress?: number;
  onClick?: () => void;
}

export default function LessonCard({
  title,
  subtitle,
  color,
  icon: Icon,
  artType,
  progress = 50,
  onClick,
}: LessonCardProps) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <button
      onClick={onClick}
      className={`text-left w-full p-4 sm:p-5 rounded-[28px] shadow-[0_4px_16px_rgba(16,24,40,0.04)] border border-black/5 flex flex-col justify-between transition-all duration-200 active:scale-[0.97] hover:shadow-md cursor-pointer`}
      style={{
        backgroundColor:
          color === 'sky'
            ? '#DCEBFF'
            : color === 'mint'
            ? '#DDF3E6'
            : color === 'peach'
            ? '#FFE6D2'
            : color === 'lilac'
            ? '#E8E1FF'
            : color === 'butter'
            ? '#FFF2C9'
            : '#FBE0EA',
      }}
    >
      <div className="flex items-start justify-between w-full mb-3">
        {/* Progress Ring with Clay/Icon Artwork inside */}
        <div className="relative w-12 h-12 shrink-0">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="24"
              cy="24"
              r={radius}
              stroke="white"
              strokeWidth="3.5"
              fill="white"
              fillOpacity="0.45"
            />
            <circle
              cx="24"
              cy="24"
              r={radius}
              stroke="#0E1116"
              strokeWidth="3.5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Centered Artwork or Icon */}
          <div className="absolute inset-0 flex items-center justify-center p-1.5">
            {artType ? (
              <ClayArt type={artType} size={28} />
            ) : Icon ? (
              <Icon size={20} className="text-[#0E1116]" />
            ) : null}
          </div>
        </div>

        {/* Mini Percentage Badge */}
        <span className="px-2 py-0.5 rounded-full bg-white/70 text-[10px] font-bold text-[#0E1116] shadow-2xs">
          {progress}%
        </span>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-bold text-[#0E1116] leading-snug tracking-tight">
          {title}
        </h3>
        <p className="text-xs font-semibold text-[#3D4652] mt-0.5 opacity-90">{subtitle}</p>
      </div>
    </button>
  );
}
