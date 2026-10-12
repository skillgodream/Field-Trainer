import React from 'react';
import { 
  Scan, 
  Package, 
  Layers, 
  ShieldCheck, 
  ClipboardCheck, 
  ShoppingCart, 
  Sparkles 
} from 'lucide-react';

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
  icon: CustomIcon,
  artType,
  progress = 50,
  onClick,
}: LessonCardProps) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Apple-grade minimalist monochrome icon mapping
  const renderIcon = () => {
    if (CustomIcon) {
      return <CustomIcon size={18} className="text-white" />;
    }
    switch (artType) {
      case 'scanner':
        return <Scan size={18} className="text-white" />;
      case 'box':
        return <Package size={18} className="text-white" />;
      case 'tote':
        return <Layers size={18} className="text-white" />;
      case 'safety':
        return <ShieldCheck size={18} className="text-white" />;
      case 'clipboard':
        return <ClipboardCheck size={18} className="text-white" />;
      case 'trolley':
        return <ShoppingCart size={18} className="text-white" />;
      default:
        return <Sparkles size={18} className="text-white" />;
    }
  };

  return (
    <button
      onClick={onClick}
      className="group relative text-left w-full p-4 sm:p-5 rounded-[28px] bg-[#0E1017]/85 hover:bg-[#151923]/95 active:scale-[0.98] backdrop-blur-2xl border border-white/[0.08] hover:border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.55)] flex flex-col justify-between transition-all duration-200 cursor-pointer overflow-hidden min-h-[178px]"
    >
      {/* Apple specular top glass rim */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Top Bar: Monochrome Progress Dial & Apple Percentage Pill */}
      <div className="flex items-start justify-between w-full mb-3 relative z-10">
        {/* Apple Monochromatic Progress Dial */}
        <div className="relative w-11 h-11 shrink-0">
          <svg className="w-full h-full -rotate-90">
            {/* Background track */}
            <circle
              cx="22"
              cy="22"
              r={radius}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="2.75"
              fill="rgba(255, 255, 255, 0.04)"
            />
            {/* White active progress arc */}
            <circle
              cx="22"
              cy="22"
              r={radius}
              stroke="#FFFFFF"
              strokeWidth="2.75"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Centered minimalist white icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            {renderIcon()}
          </div>
        </div>

        {/* Minimalist Apple Translucent Percentage Pill */}
        <span className="px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-[10px] font-mono font-medium text-white/90 backdrop-blur-md">
          {progress}%
        </span>
      </div>

      {/* Content Area */}
      <div className="relative z-10 w-full">
        <h3 className="text-base sm:text-lg font-bold text-white leading-snug tracking-tight group-hover:text-white transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="text-xs font-normal text-white/60 mt-1 line-clamp-1 leading-relaxed">
          {subtitle}
        </p>

        {/* Subtle Apple progress indicator bar at bottom */}
        <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </button>
  );
}
